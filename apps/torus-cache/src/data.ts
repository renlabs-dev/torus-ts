import type { ApiPromise } from "@polkadot/api";
import SuperJSON from "superjson";

import type { LastBlock, StakeData } from "@torus-ts/subspace";
import {
  queryLastBlock,
  queryStakeIn,
  queryStakeOut,
} from "@torus-ts/subspace";

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

const updateStakeFrom = async (api: ApiPromise, lastBlock: LastBlock) => {
  try {
    const stakeFrom = await queryStakeIn(api);
    stakeFromData = {
      total: stakeFrom.total,
      perAddr: Object.fromEntries(stakeFrom.perAddr),
      atBlock: BigInt(lastBlock.blockNumber),
      atTime: new Date(),
    };
    log(`StakeFrom data updated for block ${lastBlock.blockNumber}`);
  } catch (error) {
    log(
      `Error updating StakeFrom data for block ${lastBlock.blockNumber}:`,
      error,
    );
  }
};

const updateStakeOut = async (api: ApiPromise, lastBlock: LastBlock) => {
  try {
    const stakeOut = await queryStakeOut(api);
    stakeOutData = {
      total: stakeOut.total,
      perAddr: Object.fromEntries(stakeOut.perAddr),
      atBlock: BigInt(lastBlock.blockNumber),
      atTime: new Date(),
    };
    log(`StakeOut data updated for block ${lastBlock.blockNumber}`);
  } catch (error) {
    log(
      `Error updating StakeOut data for block ${lastBlock.blockNumber}:`,
      error,
    );
  }
};

export async function updateStakeDataLoop() {
  try {
    let lastBlock: LastBlock;
    const api = await setup();

    while (true) {
      lastBlock = await queryLastBlock(api);
      if (
        lastBlock.blockNumber <=
        Math.max(Number(stakeFromData.atBlock), Number(stakeOutData.atBlock))
      ) {
        log(`Block ${lastBlock.blockNumber} already processed, skipping`);
        await sleep(UPDATE_INTERVAL);
        continue;
      }

      log(`Block ${lastBlock.blockNumber}: processing`);

      await Promise.allSettled([
        updateStakeFrom(api, lastBlock),
        updateStakeOut(api, lastBlock),
      ]);

      log(`Data updated for block ${lastBlock.blockNumber}`);
    }
  } catch (e) {
    log("UNEXPECTED ERROR: ", e);
    log("Restarting loop in 5 seconds");
    await sleep(5000);
    updateStakeDataLoop().catch(console.error);
  }
}

export { stakeFromData, stakeOutData };
