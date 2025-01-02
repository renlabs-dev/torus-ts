import { z } from "zod";

import type { ApiPromise } from "@polkadot/api";
import { Keyring } from "@polkadot/api";
import type { KeyringPair } from "@polkadot/keyring/types";
import { cryptoWaitReady } from "@polkadot/util-crypto";

import { createDb } from "@torus-ts/db/client";
import type { LastBlock, SS58Address } from "@torus-ts/subspace";
import {
  checkSS58,
  queryKeyStakedTo,
  queryLastBlock,
  setChainWeights,
} from "@torus-ts/subspace";

import { BLOCK_TIME, log, sleep } from "../common";
import { parseEnvOrExit } from "../common/env";
import type { AgentWeight } from "../db";
import { getUserWeightMap, insertAgentWeight } from "../db";
import {
  calcFinalWeights,
  normalizeWeightsForVote,
  normalizeWeightsToPercent,
} from "../weights";

export const env = parseEnvOrExit(
  z.object({
    NEXT_PUBLIC_TORUS_RPC_URL: z.string().url(),
    TORUS_ALLOCATOR_MNEMONIC: z.string().nonempty(),
  }),
)(process.env);

export const db = createDb();

export async function weightAggregatorWorker(api: ApiPromise) {
  await cryptoWaitReady();
  const keyring = new Keyring({ type: "sr25519" });
  const keypair = keyring.addFromUri(env.TORUS_ALLOCATOR_MNEMONIC);

  let knownLastBlock: LastBlock | null = null;

  while (true) {
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

      await weightAggregatorTask(api, keypair, lastBlock.blockNumber);

      // We aim to run this task every 1 hour (8 seconds block * 450)
      await sleep(BLOCK_TIME * 450);
    } catch (e) {
      log("UNEXPECTED ERROR: ", e);
      await sleep(BLOCK_TIME);
    }
  }
}

/**
 * Fetches assigned weights by users and their stakes, to calculate the final
 * weights for the Torus Allocator.
 */
export async function weightAggregatorTask(
  api: ApiPromise,
  keypair: KeyringPair,
  lastBlock: number,
) {
  const allocatorAddress = checkSS58(keypair.address);

  const stakeOnCommunityValidator = await queryKeyStakedTo(
    api,
    allocatorAddress,
  );

  log("Committing module weights...");
  await postAgentAggregation(
    stakeOnCommunityValidator,
    api,
    keypair,
    lastBlock,
  );
}

function getNormalizedWeights(
  stakeOnCommunityValidator: Map<SS58Address, bigint>,
  weightMap: Map<string, Map<string, bigint>>,
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
function buildNetworkVote(
  voteMap: Map<string, number>,
): [SS58Address, number][] {
  const result: [SS58Address, number][] = [];
  for (const [key, weight] of voteMap) {
    result.push([checkSS58(key), weight]);
  }
  return result;
}
async function doVote(
  api: ApiPromise,
  keypair: KeyringPair,
  voteMap: Map<string, number>,
) {
  const weights = buildNetworkVote(voteMap);
  try {
    await setChainWeights(api, keypair, weights);
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
  const moduleWeightMap = await getUserWeightMap();
  const { stakeWeights, normalizedWeights, percWeights } = getNormalizedWeights(
    stakeOnCommunityValidator,
    moduleWeightMap,
  );

  const dbModuleWeights: AgentWeight[] = Array.from(stakeWeights)
    .map(([agentKey, stakeWeight]): AgentWeight | null => {
      const percWeight = percWeights.get(agentKey);
      if (percWeight === undefined) {
        console.error(`Agent id ${agentKey} not found in normalized weights`);
        return null;
      }
      return {
        agentKey: agentKey,
        computedWeight: stakeWeight,
        percComputedWeight: percWeight,
        atBlock: lastBlock,
      };
    })
    .filter((module) => module !== null);

  if (dbModuleWeights.length > 0) {
    await insertAgentWeight(dbModuleWeights);
  } else {
    console.warn("No weights to insert");
  }

  await doVote(api, keypair, normalizedWeights);
}
