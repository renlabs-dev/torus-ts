import type { ApiPromise } from "@polkadot/api";
import { Keyring } from "@polkadot/api";
import type { KeyringPair } from "@polkadot/keyring/types";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import {
  checkSS58,
  CONSTANTS,
  queryKeyStakedBy,
  queryLastBlock,
  setChainWeights,
} from "@torus-network/sdk";
import type { LastBlock, SS58Address } from "@torus-network/sdk";
import { createDb } from "@torus-ts/db/client";
import { tryAsync } from "@torus-ts/utils/try-catch";
import { z } from "zod";
import { sleep } from "../common";
import { parseEnvOrExit } from "../common/env";
import { createLogger } from "../common/log";
import type { AgentWeight } from "../db";
import { getUserWeightMap, upsertAgentWeight } from "../db";
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

const log = createLogger({ name: "weight-aggregator" });
const retryDelay = CONSTANTS.TIME.BLOCK_TIME_MILLISECONDS;

export async function weightAggregatorWorker(api: ApiPromise) {
  const [cryptoError, _] = await tryAsync(cryptoWaitReady());
  if (cryptoError !== undefined) {
    log.error(`Failed to initialize crypto: ${cryptoError}`);
    return;
  }

  const keyring = new Keyring({ type: "sr25519" });
  const keypair = keyring.addFromUri(env.TORUS_ALLOCATOR_MNEMONIC);

  let knownLastBlock: LastBlock | null = null;

  while (true) {
    const [workerError, __] = await tryAsync(
      (async () => {
        const [blockError, lastBlock] = await tryAsync(queryLastBlock(api));
        if (blockError !== undefined) {
          log.error(blockError);
          await sleep(retryDelay / 2);
          return;
        }

        if (
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          knownLastBlock !== null &&
          lastBlock.blockNumber <= knownLastBlock
        ) {
          log.info(
            `Block ${lastBlock.blockNumber}: already processed, skipping`,
          );
          await sleep(retryDelay / 2);
          return;
        }
        knownLastBlock = lastBlock;

        log.info(`Block ${lastBlock.blockNumber}: processing`);

        const [taskError, ___] = await tryAsync(
          weightAggregatorTask(api, keypair, lastBlock.blockNumber),
        );
        if (taskError !== undefined) {
          log.error(`Failed to run weight aggregator task: ${taskError}`);
          return;
        }

        // We aim to run this task every ~5 minutes (8 seconds block * 38)
        log.info(
          `Waiting for ${(retryDelay * 37) / 1000} seconds until next run`,
        );
      })(),
    );

    if (workerError !== undefined) {
      log.error(`Unexpected worker error: ${workerError}`);
    }

    await sleep(retryDelay * 37);
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

  const [stakeError, stakeOnCommunityValidator] = await tryAsync(
    queryKeyStakedBy(api, allocatorAddress),
  );
  if (stakeError !== undefined) {
    log.error(`Failed to query stakes: ${stakeError}`);
    return;
  }

  log.info("Committing agent weights...");

  const [aggregationError, _] = await tryAsync(
    postAgentAggregation(stakeOnCommunityValidator, api, keypair, lastBlock),
  );
  if (aggregationError !== undefined) {
    log.error(`Failed to post agent aggregation: ${aggregationError}`);
    return;
  }

  log.info("Committed agent weights.");
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

  log.info(`Setting weights for keypair: ${keypair.address}`);
  log.info(`Setting weights for ${weights.length}: agents`);

  const [weightError, setWeightsTx] = await tryAsync(
    setChainWeights(api, keypair, weights),
  );

  if (weightError !== undefined) {
    log.error(`Failed to set weights on chain: ${weightError}`);
    throw weightError;
  }

  log.info(`Set weights transaction: ${setWeightsTx.toString()}`);
  return setWeightsTx;
}

async function postAgentAggregation(
  stakeOnCommunityValidator: Map<SS58Address, bigint>,
  api: ApiPromise,
  keypair: KeyringPair,
  lastBlock: number,
) {
  const [weightMapError, moduleWeightMap] = await tryAsync(getUserWeightMap());
  if (weightMapError !== undefined) {
    log.error(`Failed to get user weight map: ${weightMapError}`);
    return;
  }

  // gambiarra to remove the allocator from the weights
  moduleWeightMap.forEach((innerMap, _) => {
    if (innerMap.has(keypair.address)) {
      innerMap.delete(keypair.address);
    }
  });

  const { stakeWeights, normalizedWeights, percWeights } = getNormalizedWeights(
    stakeOnCommunityValidator,
    moduleWeightMap,
  );

  const dbModuleWeights: AgentWeight[] = Array.from(stakeWeights)
    .map(([agentKey, stakeWeight]): AgentWeight | null => {
      const percWeight = percWeights.get(agentKey);
      if (percWeight === undefined) {
        log.error(`Agent id ${agentKey} not found in normalized weights`);
        return null;
      }
      return {
        agentKey: agentKey,
        computedWeight: stakeWeight.toString(),
        percComputedWeight: percWeight,
        atBlock: lastBlock,
      };
    })
    .filter((module) => module !== null);

  if (dbModuleWeights.length > 0) {
    const [upsertError, _] = await tryAsync(upsertAgentWeight(dbModuleWeights));
    if (upsertError !== undefined) {
      log.error(`Failed to upsert agent weights: ${upsertError}`);
      return;
    }
    log.info(`Inserted ${dbModuleWeights.length} agent weights`);
  } else {
    log.warn("No weights to insert");
  }

  const [voteError, __] = await tryAsync(
    doVote(api, keypair, normalizedWeights),
  );
  if (voteError !== undefined) {
    log.error(`Failed to submit votes to chain: ${voteError}`);
    return;
  }

  log.info(`Successfully submitted votes for ${normalizedWeights.size} agents`);
}
