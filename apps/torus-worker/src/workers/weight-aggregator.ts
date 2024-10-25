import type { KeyringPair } from "@polkadot/keyring/types";
import { Keyring } from "@polkadot/api";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { assert } from "tsafe";

import type { ApiPromise } from "@torus-ts/subspace/queries";
import type { LastBlock, SS58Address } from "@torus-ts/types";
import type { SubspaceStorageName } from "@torus-ts/utils";
import { and, eq, sql } from "@torus-ts/db";
import { db } from "@torus-ts/db/client";
import {
  moduleData,
  subnetDataSchema,
  userModuleData,
  userSubnetDataSchema,
} from "@torus-ts/db/schema";
import { queryChain, queryLastBlock } from "@torus-ts/subspace/queries";
import { STAKE_FROM_SCHEMA } from "@torus-ts/types";

import type { ModuleWeight, SubnetWeight } from "../db";
import {
  BLOCK_TIME,
  CONSENSUS_NETUID,
  log,
  sleep,
  SUBNETS_NETUID,
} from "../common";
import { insertModuleWeight, insertSubnetWeight } from "../db";
import { env } from "../env";
import {
  calcFinalWeights,
  normalizeWeightsForVote,
  normalizeWeightsToPercent,
} from "../weights";

type AggregatorKind = "module" | "subnet";

export async function weightAggregatorWorker(api: ApiPromise) {
  await cryptoWaitReady();
  const keyring = new Keyring({ type: "sr25519" });
  const keypair = keyring.addFromUri(env.COMMUNITY_VALIDATOR_MNEMONIC);

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
  }

  if (aggregator == "module") {
    log(`Committing module weights...`);
    await postModuleAggregation(
      stakeOnCommunityValidator,
      api,
      keypair,
      lastBlock,
    );
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  } else if (aggregator == "subnet") {
    log(`Committing subnet weights...`);
    await postSubnetAggregation(
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

async function postModuleAggregation(
  stakeOnCommunityValidator: Map<SS58Address, bigint>,
  api: ApiPromise,
  keypair: KeyringPair,
  lastBlock: number,
) {
  const uidMap = await getModuleUids();
  const moduleWeightMap = await getUserWeightMap();
  const { stakeWeights, normalizedWeights, percWeights } = getNormalizedWeights(
    stakeOnCommunityValidator,
    moduleWeightMap,
  );

  const dbModuleWeights: ModuleWeight[] = Array.from(stakeWeights)
    .map(([moduleId, stakeWeight]): ModuleWeight | null => {
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
    await insertModuleWeight(dbModuleWeights);
  } else {
    console.warn(`No weights to insert`);
  }

  await doVote(api, keypair, CONSENSUS_NETUID, normalizedWeights);
}

async function postSubnetAggregation(
  stakeOnCommunityValidator: Map<SS58Address, bigint>,
  api: ApiPromise,
  keypair: KeyringPair,
  lastBlock: number,
) {
  const subnetWeightMap = await getUserSubnetWeightMap();

  const { stakeWeights, normalizedWeights, percWeights } = getNormalizedWeights(
    stakeOnCommunityValidator,
    subnetWeightMap,
  );

  const dbSubnetWeights: SubnetWeight[] = Array.from(stakeWeights)
    .map(([netuid, stakeWeight]): SubnetWeight | null => {
      const subnetPercWeight = percWeights.get(netuid);
      if (subnetPercWeight === undefined) {
        console.error(`Subnet id ${netuid} not found in normalizedPercWeights`);
        return null;
      }
      return {
        netuid: netuid,
        percWeight: subnetPercWeight,
        stakeWeight: stakeWeight,
        atBlock: lastBlock,
      };
    })
    .filter((subnet) => subnet !== null);

  if (dbSubnetWeights.length > 0) {
    await insertSubnetWeight(dbSubnetWeights);
  } else {
    console.warn(`No weights to insert`);
  }

  await doVote(api, keypair, SUBNETS_NETUID, normalizedWeights);
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
async function getModuleUids(): Promise<Map<number, number>> {
  const result = await db
    .select({
      moduleId: moduleData.moduleId,
      uid: moduleData.id,
    })
    .from(moduleData)
    .where(
      eq(
        moduleData.atBlock,
        sql`(SELECT at_block FROM module_data ORDER BY at_block DESC LIMIT 1)`,
      ),
    )
    .execute();

  // TODO: by module table id
  const uidMap = new Map<number, number>();
  result.forEach((row) => {
    uidMap.set(row.moduleId, row.uid);
  });
  return uidMap;
}

/**
 * Queries the user-module data table to build a mapping of user keys to
 * module keys to weights.
 *
 * @returns user key -> module id -> weight (0–100)
 */
async function getUserWeightMap(): Promise<Map<string, Map<number, bigint>>> {
  const result = await db
    .select({
      userKey: userModuleData.userKey,
      weight: userModuleData.weight,
      moduleKey: moduleData.moduleKey,
      moduleId: moduleData.moduleId,
    })
    .from(moduleData)
    // filter modules updated on the last seen block
    .where(
      and(
        eq(
          moduleData.atBlock,
          sql`(SELECT at_block FROM module_data ORDER BY at_block DESC LIMIT 1)`,
        ),
        eq(moduleData.isWhitelisted, true),
      ),
    )
    .innerJoin(userModuleData, eq(moduleData.id, userModuleData.moduleId));
  const weightMap = new Map<string, Map<number, bigint>>();
  result.forEach((entry) => {
    if (!weightMap.has(entry.userKey)) {
      weightMap.set(entry.userKey, new Map());
    }
    weightMap.get(entry.userKey)?.set(entry.moduleId, BigInt(entry.weight));
  });
  return weightMap;
}

async function getUserSubnetWeightMap(): Promise<
  Map<string, Map<number, bigint>>
> {
  const result = await db
    .select({
      userKey: userSubnetDataSchema.userKey,
      weight: userSubnetDataSchema.weight,
      netuid: subnetDataSchema.netuid,
    })
    .from(subnetDataSchema)
    // filter subnets updated on the last seen block
    .where(
      and(
        eq(
          subnetDataSchema.atBlock,
          sql`(SELECT at_block FROM subnet_data ORDER BY at_block DESC LIMIT 1)`,
        ),
      ),
    )
    .innerJoin(
      userSubnetDataSchema,
      eq(subnetDataSchema.netuid, userSubnetDataSchema.netuid),
    );
  const weightMap = new Map<string, Map<number, bigint>>();
  result.forEach((entry) => {
    if (!weightMap.has(entry.userKey)) {
      weightMap.set(entry.userKey, new Map());
    }
    weightMap.get(entry.userKey)?.set(entry.netuid, BigInt(entry.weight));
  });
  return weightMap;
}
