import type { ApiPromise } from "@polkadot/api";
import { Keyring } from "@polkadot/api";
import type { KeyringPair } from "@polkadot/keyring/types";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { z } from "zod";

import type { LastBlock } from "@torus-network/sdk/chain";
import {
  queryKeyStakedBy,
  queryLastBlock,
  setChainWeights,
} from "@torus-network/sdk/chain";
import { CONSTANTS } from "@torus-network/sdk/constants";
import type { SS58Address } from "@torus-network/sdk/types";
import { checkSS58 } from "@torus-network/sdk/types";
import { BasicLogger } from "@torus-network/torus-utils/logger";
import { tryAsync } from "@torus-network/torus-utils/try-catch";

import { createDb } from "@torus-ts/db/client";

import { sleep } from "../common";
import { parseEnvOrExit } from "../common/env";
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

const log = BasicLogger.create({ name: "weight-aggregator" });
const retryDelay = CONSTANTS.TIME.BLOCK_TIME_MILLISECONDS;

/**
 * Core weight aggregation worker that runs continuously.
 * Calculates and commits validator weights based on user preferences and stake
 * approximately every 5 minutes (37 blockchain blocks).
 *
 * Implements a polling pattern with explicit block processing and deduplication
 * to ensure each block is processed exactly once, with proper error handling.
 *
 * @param api - Connected Polkadot API instance for chain interaction
 */
export async function weightAggregatorWorker(api: ApiPromise) {
  const cryptoRes = await tryAsync(cryptoWaitReady());
  if (log.ifResultIsErr(cryptoRes)) return;

  const keyring = new Keyring({ type: "sr25519" });
  const keypair = keyring.addFromUri(env.TORUS_ALLOCATOR_MNEMONIC);

  let knownLastBlock: LastBlock | null = null;

  while (true) {
    const workerRes = await tryAsync(
      (async () => {
        const blockRes = await tryAsync(queryLastBlock(api));
        if (log.ifResultIsErr(blockRes)) {
          await sleep(retryDelay / 2);
          return;
        }
        const [_blockErr, lastBlock] = blockRes;

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

        const taskRes = await tryAsync(
          weightAggregatorTask(api, keypair, lastBlock.blockNumber),
        );
        const taskErrorMsg = () => "Failed to run weight aggregator task:";
        if (log.ifResultIsErr(taskRes, taskErrorMsg)) return;

        // We aim to run this task every ~5 minutes (8 seconds block * 38)
        log.info(
          `Waiting for ${(retryDelay * 37) / 1000} seconds until next run`,
        );
      })(),
    );

    if (log.ifResultIsErr(workerRes)) {
      // log.ifResultIsErr already logs the error
    }

    await sleep(retryDelay * 37);
  }
}

/**
 * Main weight calculation and submission task.
 * Pulls stake data from chain, aggregates user-assigned weights,
 * normalizes them, and submits the final weights on-chain.
 *
 * @param api - Polkadot API instance for blockchain queries and transactions
 * @param keypair - Allocator account with permission to set weights
 * @param lastBlock - Block number for tracking when weights were calculated
 */
export async function weightAggregatorTask(
  api: ApiPromise,
  keypair: KeyringPair,
  lastBlock: number,
) {
  const allocatorAddress = checkSS58(keypair.address);

  const stakeRes = await tryAsync(queryKeyStakedBy(api, allocatorAddress));
  if (log.ifResultIsErr(stakeRes)) return;
  const [_stakeErr, stakeOnCommunityValidator] = stakeRes;

  log.info("Committing agent weights...");

  const aggregationRes = await tryAsync(
    postAgentAggregation(stakeOnCommunityValidator, api, keypair, lastBlock),
  );
  if (log.ifResultIsErr(aggregationRes)) return;

  log.info("Committed agent weights.");
}

/**
 * Transforms raw stake and weight data into normalized weights for on-chain voting.
 * Applies stake-weighting to user preferences to produce final influence distribution.
 *
 * @param stakeOnCommunityValidator - Map of validator addresses to stake amounts
 * @param weightMap - Nested map of user preferences (user → validator → weight)
 * @returns Three different weight representations for different contexts (staked, normalized and the percentage)
 */
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
 * Transforms a weight map into the array format required by the blockchain API.
 * Ensures all keys are valid SS58 addresses before submission.
 *
 * @param voteMap - Map of agent addresses to their normalized weights
 * @returns Array of [address, weight] tuples ready for on-chain submission
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

/**
 * Executes the on-chain transaction to submit new agent weights.
 * Converts the weight map to the expected format and submits it
 * via the allocator's keypair.
 *
 * @param api - Polkadot API instance for transaction submission
 * @param keypair - Allocator account with permission to set weights
 * @param voteMap - Map of agent addresses to their normalized weights
 * @returns Transaction hash of the submitted transaction
 */
async function doVote(
  api: ApiPromise,
  keypair: KeyringPair,
  voteMap: Map<string, number>,
) {
  const weights = buildNetworkVote(voteMap);

  log.info(`Setting weights for keypair: ${keypair.address}`);
  log.info(`Setting weights for ${weights.length}: agents`);

  const weightRes = await tryAsync(setChainWeights(api, keypair, weights));

  if (log.ifResultIsErr(weightRes)) {
    throw new Error("Failed to set weights on chain");
  }
  const [_weightErr, setWeightsTx] = weightRes;

  log.info(`Set weights transaction: ${setWeightsTx.toString()}`);
  return setWeightsTx;
}

/**
 * Processes and submits the final agent weight aggregation.
 * Orchestrates the entire process:
 * 1. Fetches user weight preferences from database
 * 2. Applies stake-weighting and normalization
 * 3. Stores results back to database for reporting
 * 4. Submits final weights to the blockchain
 *
 * Ensures the allocator itself is excluded from weight calculations
 * to prevent self-voting conflicts.
 *
 * @param stakeOnCommunityValidator - Map of validator addresses to stake amounts
 * @param api - Polkadot API instance for blockchain interaction
 * @param keypair - Allocator account with permission to set weights
 * @param lastBlock - Current block number for tracking weight calculation timing
 */

async function postAgentAggregation(
  stakeOnCommunityValidator: Map<SS58Address, bigint>,
  api: ApiPromise,
  keypair: KeyringPair,
  lastBlock: number,
) {
  const weightMapRes = await tryAsync(getUserWeightMap());
  if (log.ifResultIsErr(weightMapRes)) return;
  const [_weightMapErr, moduleWeightMap] = weightMapRes;

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
    const upsertRes = await tryAsync(upsertAgentWeight(dbModuleWeights));
    if (log.ifResultIsErr(upsertRes)) return;
    log.info(`Inserted ${dbModuleWeights.length} agent weights`);
  } else {
    log.warn("No weights to insert");
  }

  const voteRes = await tryAsync(doVote(api, keypair, normalizedWeights));
  if (log.ifResultIsErr(voteRes)) return;

  log.info(`Successfully submitted votes for ${normalizedWeights.size} agents`);
}
