import type { ApiPromise } from "@polkadot/api";
import SuperJSON from "superjson";

import type { LastBlock } from "@torus-network/sdk";
import {
  queryLastBlock,
  queryStakeIn,
  queryStakeOut,
} from "@torus-network/sdk";
import type { StakeData } from "@torus-network/sdk/cached-queries";
import { BasicLogger } from "@torus-network/torus-utils/logger";
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";

import { setup } from "./server";
import { sleep } from "./utils";

const log = BasicLogger.create({ name: "torus-cache-data" });

const UPDATE_INTERVAL = 1000;

let stakeFromData: StakeData = {
  total: -1n,
  perAddr: {},
  atBlock: -1n,
  atTime: new Date(),
};

let stakeOutData: StakeData = {
  total: -1n,
  perAddr: {},
  atBlock: -1n,
  atTime: new Date(),
};

const stakeOutDataStringified = {
  data: SuperJSON.stringify(stakeOutData),
  atBlock: -1n,
};

const stakeFromDataStringified = {
  data: SuperJSON.stringify(stakeFromData),
  atBlock: -1n,
};

export function getStakeOutDataStringified() {
  if (stakeOutDataStringified.atBlock !== stakeOutData.atBlock) {
    const stringifyErrorMsg = () => "Error stringifying stakeOutData:";
    const stringifyRes = trySync(() => SuperJSON.stringify(stakeOutData));
    if (log.ifResultIsErr(stringifyRes, stringifyErrorMsg)) {
      return stakeOutDataStringified.data;
    }
    const [_stringifyError, stringifiedData] = stringifyRes;
    stakeOutDataStringified.data = stringifiedData;
    stakeOutDataStringified.atBlock = stakeOutData.atBlock;
  }
  return stakeOutDataStringified.data;
}

export function getStakeFromDataStringified() {
  if (stakeFromDataStringified.atBlock !== stakeFromData.atBlock) {
    const stringifyErrorMsg = () => "Error stringifying stakeFromData:";
    const stringifyRes = trySync(() => SuperJSON.stringify(stakeFromData));
    if (log.ifResultIsErr(stringifyRes, stringifyErrorMsg)) {
      return stakeFromDataStringified.data;
    }
    const [_stringifyError, stringifiedData] = stringifyRes;
    stakeFromDataStringified.data = stringifiedData;
    stakeFromDataStringified.atBlock = stakeFromData.atBlock;
  }
  return stakeFromDataStringified.data;
}

/**
 * Updates the stake data from the chain
 * @param api API instance for blockchain queries
 * @param lastBlock Latest block information
 */
export const updateStakeFrom = async (
  api: ApiPromise,
  lastBlock: LastBlock,
) => {
  const queryErrorMsg = () =>
    `Error updating StakeFrom data for block ${lastBlock.blockNumber}:`;
  const queryStateQuintRes = await tryAsync(queryStakeIn(api));
  if (log.ifResultIsErr(queryStateQuintRes, queryErrorMsg)) return;
  const [_queryError, stakeForm] = queryStateQuintRes;

  stakeFromData = {
    total: stakeForm.total,
    perAddr: Object.fromEntries(stakeForm.perAddr),
    atBlock: BigInt(lastBlock.blockNumber),
    atTime: new Date(),
  };
  log.info(`StakeFrom data updated for block ${lastBlock.blockNumber}`);
};

/**
 * Updates staking data for outgoing stake allocations from the blockchain
 *
 * Queries the current stake-out information from the blockchain and updates
 * the local stakeOutData object with the total stake, per-address breakdown,
 * and current block/time information.
 *
 * @param api - Polkadot API instance used to query blockchain data
 * @param lastBlock - Latest block information including block number
 * @returns Promise that resolves when the operation completes
 */
export const updateStakeOut = async (api: ApiPromise, lastBlock: LastBlock) => {
  const queryErrorMsg = () =>
    `Error updating StakeOut data for block ${lastBlock.blockNumber}:`;
  const queryRes = await tryAsync(queryStakeOut(api));
  if (log.ifResultIsErr(queryRes, queryErrorMsg)) return;
  const [_queryError, stakeOut] = queryRes;

  stakeOutData = {
    total: stakeOut.total,
    perAddr: Object.fromEntries(stakeOut.perAddr),
    atBlock: BigInt(lastBlock.blockNumber),
    atTime: new Date(),
  };
  log.info(`StakeOut data updated for block ${lastBlock.blockNumber}`);
};

/**
 * Continuously monitors and updates stake data from the blockchain.
 *
 * This function runs an infinite loop that:
 * 1. Establishes a connection to the blockchain API
 * 2. Queries for new blocks
 * 3. Updates stakeFrom and stakeOut data when new blocks are found
 * 4. Handles errors at each step with appropriate retry strategies
 *
 * The function implements robust error handling with different recovery paths:
 * - API setup failures: Retries after a delay
 * - Block query failures: Reestablishes API connection
 * - Stake update failures: Logs errors but continues operation
 *
 * The function avoids processing the same block twice by tracking the last
 * processed block number in the stakeFromData and stakeOutData objects.
 */
export async function updateStakeDataLoop() {
  while (true) {
    const setupErrorMsg = () =>
      `Error setting up API, retrying in ${UPDATE_INTERVAL / 1000}s`;
    const setupRes = await tryAsync(setup());
    if (log.ifResultIsErr(setupRes, setupErrorMsg)) {
      await sleep(UPDATE_INTERVAL);
      continue;
    }
    const [_setupError, api] = setupRes;

    while (true) {
      const queryErrorMsg = () =>
        "Error querying last block, restarting connection";
      const queryRes = await tryAsync(queryLastBlock(api));
      if (log.ifResultIsErr(queryRes, queryErrorMsg)) {
        break;
      }
      const [_queryError, lastBlock] = queryRes;

      const maxBlockErrorMsg = () => "Error calculating max block:";
      const maxBlockRes = trySync(() =>
        Math.max(Number(stakeFromData.atBlock), Number(stakeOutData.atBlock)),
      );
      if (log.ifResultIsErr(maxBlockRes, maxBlockErrorMsg)) {
        await sleep(UPDATE_INTERVAL);
        continue;
      }
      const [_maxBlockError, maxBlock] = maxBlockRes;

      if (lastBlock.blockNumber <= maxBlock) {
        log.info(`Block ${lastBlock.blockNumber} already processed, skipping`);
        await sleep(UPDATE_INTERVAL);
        continue;
      }
      log.info(`Block ${lastBlock.blockNumber}: processing`);

      const promiseErrorMsg = () => "Error executing Promise.allSettled:";
      const promiseRes = await tryAsync(
        Promise.allSettled([
          updateStakeFrom(api, lastBlock),
          updateStakeOut(api, lastBlock),
        ]),
      );
      if (log.ifResultIsErr(promiseRes, promiseErrorMsg)) {
        await sleep(UPDATE_INTERVAL);
        continue;
      }
      const [_promiseError, endResult] = promiseRes;
      const stakeFromResult = endResult[0];
      const stakeOutResult = endResult[1];
      if (stakeFromResult.status === "rejected") {
        log.error(`Error updating stakeFrom: ${stakeFromResult.reason}`);
      }
      if (stakeOutResult.status === "rejected") {
        log.error(`Error updating stakeOut: ${stakeOutResult.reason}`);
      }
      if (
        stakeFromResult.status === "fulfilled" &&
        stakeOutResult.status === "fulfilled"
      ) {
        log.info(`Data updated for block ${lastBlock.blockNumber}`);
      } else {
        log.warn(`Partial data update for block ${lastBlock.blockNumber}`);
      }
      await sleep(UPDATE_INTERVAL);
    }
    log.info(`Restarting connection in 5 seconds`);
    await sleep(5000);
  }
}
export { stakeFromData, stakeOutData };
