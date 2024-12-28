import type { ApiPromise } from "@polkadot/api";
import type { KeyringPair } from "@polkadot/keyring/types";
import { Keyring } from "@polkadot/api";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { assert } from "tsafe";

import type {
  LastBlock,
  SS58Address,
  SubspaceStorageName,
} from "@torus-ts/subspace";
import { and, eq, sql } from "@torus-ts/db";
import { createDb } from "@torus-ts/db/client";
import { agentSchema, userAgentWeightSchema } from "@torus-ts/db/schema";
import {
  queryChain,
  queryLastBlock,
  STAKE_FROM_SCHEMA,
} from "@torus-ts/subspace";

import { BLOCK_TIME, CONSENSUS_NETUID, log, sleep } from "../common";

import { env } from "../env";
import {
  calcFinalWeights,
  normalizeWeightsForVote,
  normalizeWeightsToPercent,
} from "../weights";
import type { AgentWeight } from "../db";
import { insertAgentWeight } from "../db";

type AggregatorKind = "module" | "subnet";

const db = createDb();

export async function weightAggregatorWorker(api: ApiPromise) {
  await cryptoWaitReady();
  const keyring = new Keyring({ type: "sr25519" });
  const keypair = keyring.addFromUri(env.TORUS_ALLOCATOR_MNEMONIC);

  let knownLastBlock: LastBlock | null = null;
  let loopCounter = 0;

  while (true) {
    loopCounter += 1;
    try {
      const lastBlock = await queryLastBlock(api);
      if (
        knownLastBlock != null &&
        lastBlock.blockNumber <= knownLastBlock.blockNumber
      ) {
        log(`Block ${lastBlock.blockNumber} already processed, skipping`);
        await sleep(BLOCK_TIME / 2);
        continue;
      }
      knownLastBlock = lastBlock;

      log(`Block ${lastBlock.blockNumber}: processing`);

      // To avoid "Priority is too low" / conflicting transactions when casting
      // votes we alternate the blocks in which each type of vote is done
      if (loopCounter % 2 === 0) {
        await weightAggregatorTask(
          api,
          keypair,
          lastBlock.blockNumber,
          "module",
        );
      } else {
        await weightAggregatorTask(
          api,
          keypair,
          lastBlock.blockNumber,
          "subnet",
        );
      }
      // We aim to run this task every 1 hour (8 seconds block * 450)
      await sleep(BLOCK_TIME * 450);
    } catch (e) {
      log("UNEXPECTED ERROR: ", e);
      await sleep(BLOCK_TIME);
      continue;
    }
  }
}

/**
 * Fetches assigned weights by users and their stakes, to calculate the final
 * weights for the community validator.
 */
export async function weightAggregatorTask(
  api: ApiPromise,
  keypair: KeyringPair,
  lastBlock: number,
  aggregator: AggregatorKind,
) {
  const storages: SubspaceStorageName[] = ["stakeFrom"];
  const storageMap = { subspaceModule: storages };
  const queryResult = await queryChain(api, storageMap, lastBlock);
  const stakeFromData = STAKE_FROM_SCHEMA.parse({
    stakeFromStorage: queryResult.stakeFrom,
  }).stakeFromStorage;

  const communityValidatorAddress = keypair.address as SS58Address;
  const stakeOnCommunityValidator = stakeFromData.get(
    communityValidatorAddress,
  );
  if (stakeOnCommunityValidator == undefined) {
    throw new Error(
      `Community validator ${communityValidatorAddress} not found in stake data`,
    );
  } else if (aggregator == "module") {
    log(`Committing module weights...`);
    await postAgentAggregation(
      stakeOnCommunityValidator,
      api,
      keypair,
      lastBlock,
    );
  }
}

function getNormalizedWeights(
  stakeOnCommunityValidator: Map<SS58Address, bigint>,
  weightMap: Map<string, Map<number, bigint>>,
) {
  const finalWeights = calcFinalWeights(stakeOnCommunityValidator, weightMap);
  const normalizedVoteWeights = normalizeWeightsForVote(finalWeights);
  const normalizedPercWeights = normalizeWeightsToPercent(finalWeights);
  return {
    stakeWeights: finalWeights,
    normalizedWeights: normalizedVoteWeights,
    percWeights: normalizedPercWeights,
  };
}

/**
 * Builds network vote arrays from a vote map.
 *
 * @param voteMap - A Map object containing uid-weight pairs.
 * @returns An object containing two arrays: uids and weights.
 * - `uids`: An array of user IDs.
 * - `weights`: An array of corresponding weights.
 */
function buildNetworkVote(voteMap: Map<number, number>) {
  const uids: number[] = [];
  const weights: number[] = [];
  for (const [uid, weight] of voteMap) {
    uids.push(uid);
    weights.push(weight);
  }
  return { uids, weights };
}

async function doVote(
  api: ApiPromise,
  keypair: KeyringPair,
  netuid: number,
  voteMap: Map<number, number>,
) {
  const { uids, weights } = buildNetworkVote(voteMap);
  if (uids.length === 0) {
    console.warn("No weights to set");
    return;
  }
  try {
    await setChainWeights(api, keypair, netuid, uids, weights);
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    console.error(`Failed to set weights on chain: ${err}`);
    return;
  }
}

async function postAgentAggregation(
  stakeOnCommunityValidator: Map<SS58Address, bigint>,
  api: ApiPromise,
  keypair: KeyringPair,
  lastBlock: number,
) {
  const uidMap = await getAgentIds();
  const moduleWeightMap = await getUserWeightMap();
  const { stakeWeights, normalizedWeights, percWeights } = getNormalizedWeights(
    stakeOnCommunityValidator,
    moduleWeightMap,
  );

  const dbModuleWeights: AgentWeight[] = Array.from(stakeWeights)
    .map(([moduleId, stakeWeight]): AgentWeight | null => {
      const moduleActualId = uidMap.get(moduleId);
      if (moduleActualId === undefined) {
        console.error(`Module id ${moduleId} not found in uid map`);
        return null;
      }
      const percWeight = percWeights.get(moduleId);
      if (percWeight === undefined) {
        console.error(
          `Module id ${moduleId} not found in normalizedPercWeights`,
        );
        return null;
      }
      return {
        moduleId: moduleActualId,
        percWeight: percWeight,
        stakeWeight: stakeWeight,
        atBlock: lastBlock,
      };
    })
    .filter((module) => module !== null);

  if (dbModuleWeights.length > 0) {
    await insertAgentWeight(dbModuleWeights);
  } else {
    console.warn(`No weights to insert`);
  }

  await doVote(api, keypair, CONSENSUS_NETUID, normalizedWeights);
}
async function setChainWeights(
  api: ApiPromise,
  keypair: KeyringPair,
  netuid: number,
  uids: number[],
  weights: number[],
) {
  assert(
    uids.length === weights.length,
    "UIDs and weights arrays must have the same length",
  );
  assert(api.tx.subspaceModule != undefined);
  assert(api.tx.subspaceModule.setWeights != undefined);
  const tx = await api.tx.subspaceModule
    .setWeights(netuid, uids, weights)
    .signAndSend(keypair);
  return tx;
}

/**
 * Queries the module data table to build a mapping of module UIDS to ids.
 */
async function getAgentIds(): Promise<Map<string, number>> {
  const result = await db
    .select({
      id: agentSchema.id,
      key: agentSchema.key,
    })
    .from(agentSchema)
    .where(eq(agentSchema.atBlock, sql`(SELECT MAX(at_block) FROM agent)`))
    .execute();

  const idMap = new Map<string, number>();
  result.forEach((row) => {
    if (row.key) {
      idMap.set(row.key, row.id);
    }
  });
  return idMap;
}
/**
 * Queries the user-module data table to build a mapping of user keys to
 * module keys to weights.
 *
 * @returns user key -> module id -> weight (0–100)
 */
async function getUserWeightMap(): Promise<Map<string, Map<string, bigint>>> {
  // TODO: move to ../../db
  const result = await db
    .select({
      userKey: userAgentWeightSchema.userKey,
      weight: userAgentWeightSchema.weight,
      agentKey: agentSchema.key,
      agentId: agentSchema.id,
    })
    .from(agentSchema)
    // filter agents updated on the last seen block
    .where(
      and(
        eq(agentSchema.atBlock, sql`(SELECT MAX(at_block) FROM agent)`),
        eq(agentSchema.isWhitelisted, true),
      ),
    )
    .innerJoin(
      userAgentWeightSchema,
      eq(agentSchema.key, userAgentWeightSchema.agentKey),
    )
    .execute();

  const weightMap = new Map<string, Map<string, bigint>>();
  result.forEach((entry) => {
    if (!weightMap.has(entry.userKey)) {
      weightMap.set(entry.userKey, new Map());
    }
    if (entry.agentKey) {
      weightMap.get(entry.userKey)?.set(entry.agentKey, BigInt(entry.weight));
    }
  });
  return weightMap;
}
