import type { ApiPromise } from "@polkadot/api";
import type { LastBlock, StakeData } from "@torus-network/sdk";
import {
  queryLastBlock,
  queryStakeIn,
  queryStakeOut,
} from "@torus-network/sdk";
import { tryAsync } from "@torus-ts/utils/try-catch";
import SuperJSON from "superjson";
import { setup } from "./server";
import { log, sleep } from "./utils";

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
    stakeOutDataStringified.data = SuperJSON.stringify(stakeOutData);
    stakeOutDataStringified.atBlock = stakeOutData.atBlock;
  }
  return stakeOutDataStringified.data;
}

export function getStakeFromDataStringified() {
  if (stakeFromDataStringified.atBlock !== stakeFromData.atBlock) {
    stakeFromDataStringified.data = SuperJSON.stringify(stakeFromData);
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
  const [error, stakeForm] = await tryAsync(queryStakeIn(api));
  if (error !== undefined) {
    log(
      `Error updating StakeFrom data for block ${lastBlock.blockNumber}:`,
      error,
    );
    return;
  }
  stakeFromData = {
    total: stakeForm.total,
    perAddr: Object.fromEntries(stakeForm.perAddr),
    atBlock: BigInt(lastBlock.blockNumber),
    atTime: new Date(),
  };
  log(`StakeFrom data updated for block ${lastBlock.blockNumber}`);
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
  const [error, stakeOut] = await tryAsync(queryStakeOut(api));
  if (error !== undefined) {
    log(
      `Error updating StakeIn data for block ${lastBlock.blockNumber}:`,
      error,
    );
    return;
  }
  stakeOutData = {
    total: stakeOut.total,
    perAddr: Object.fromEntries(stakeOut.perAddr),
    atBlock: BigInt(lastBlock.blockNumber),
    atTime: new Date(),
  };
  log(`StakeOut data updated for block ${lastBlock.blockNumber}`);
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
    const [setupError, api] = await tryAsync(setup());
    if (setupError !== undefined) {
      log(
        "Error setting up API: ",
        setupError,
        `retrying in  ${UPDATE_INTERVAL / 1000}s`,
      );
      await sleep(UPDATE_INTERVAL);
      continue;
    }
    while (true) {
      const [queryError, lastBlock] = await tryAsync(queryLastBlock(api));
      if (queryError !== undefined) {
        log("Error querying last block: ", queryError, `restarting connection`);
        break;
      }
      if (
        lastBlock.blockNumber <=
        Math.max(Number(stakeFromData.atBlock), Number(stakeOutData.atBlock))
      ) {
        log(`Block ${lastBlock.blockNumber} already processed, skipping`);
        await sleep(UPDATE_INTERVAL);
        continue;
      }
      log(`Block ${lastBlock.blockNumber}: processing`);

      const [promiseError, endResult] = await tryAsync(
        Promise.allSettled([
          updateStakeFrom(api, lastBlock),
          updateStakeOut(api, lastBlock),
        ]),
      );
      if (promiseError !== undefined) {
        log(`Error executing Promise.allSettled: ${promiseError}`);
      }
      if (endResult !== undefined) {
        const stakeFromResult = endResult[0];
        const stakeOutResult = endResult[1];
        if (stakeFromResult.status === "rejected") {
          log(`Error updating stakeFrom: ${stakeFromResult.reason}`);
        }
        if (stakeOutResult.status === "rejected") {
          log(`Error updating stakeOut: ${stakeOutResult.reason}`);
        }
        if (
          stakeFromResult.status === "fulfilled" &&
          stakeOutResult.status === "fulfilled"
        ) {
          log(`Data updated for block ${lastBlock.blockNumber}`);
        } else {
          log(`Partial data update for block ${lastBlock.blockNumber}`);
        }
        await sleep(UPDATE_INTERVAL);
      }
      log(`Restarting connection in 5 seconds`);
      await sleep(5000);
    }
  }
}
export { stakeOutData, stakeFromData };
