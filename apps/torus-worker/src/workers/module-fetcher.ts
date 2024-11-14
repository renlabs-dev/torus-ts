import type { SS58Address } from "@torus-ts/subspace/address";
import {
  queryLastBlock,
  queryRegisteredModulesInfo,
  queryWhitelist,
} from "@torus-ts/subspace/queries";

import type { WorkerProps } from "../common";
import {
  BLOCK_TIME,
  CONSENSUS_NETUID,
  isNewBlock,
  log,
  sleep,
} from "../common";
import { upsertModuleData } from "../db";
import { SubspaceModuleToDatabase } from "../db/type-transformations.js";

export async function moduleFetcherWorker(props: WorkerProps) {
  while (true) {
    try {
      const currentTime = new Date();
      const lastBlock = await queryLastBlock(props.api);

      // Check if the last queried block is a new block
      if (!isNewBlock(props.lastBlock.blockNumber, lastBlock.blockNumber)) {
        await sleep(BLOCK_TIME);
        continue;
      }
      props.lastBlock = lastBlock;

      log(`Block ${lastBlock.blockNumber}: processing`);

      const whitelist = new Set(await queryWhitelist(lastBlock.apiAtBlock));
      const isWhitelisted = (addr: SS58Address) => whitelist.has(addr);

      const modules = await queryRegisteredModulesInfo(
        lastBlock.apiAtBlock,
        CONSENSUS_NETUID,
        props.lastBlock.blockNumber,
      );
      const modulesData = modules.map((module) =>
        SubspaceModuleToDatabase(
          module,
          lastBlock.blockNumber,
          isWhitelisted(module.key),
        ),
      );
      log(
        `Block ${lastBlock.blockNumber}: upserting  ${modules.length} modules`,
      );

      await upsertModuleData(modulesData);

      log(
        `Block ${lastBlock.blockNumber}: module data upserted in ${(new Date().getTime() - currentTime.getTime()) / 1000} seconds`,
      );
    } catch (e) {
      log("UNEXPECTED ERROR: ", e);
      await sleep(BLOCK_TIME);
      continue;
    }
  }
}
