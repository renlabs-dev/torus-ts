import {
  queryLastBlock,
  querySubnetParams,
} from "@torus-ts/subspace/queries";

import type { WorkerProps } from "../common";
import { BLOCK_TIME, isNewBlock, log, sleep } from "../common";
import { upsertSubnetData } from "../db";
import { SubnetToDatabase } from "../db/type-transformations.js";

export async function subnetFetcherWorker(props: WorkerProps) {
  while (true) {
    try {
      const currentTime = new Date();
      const lastBlock = await queryLastBlock(props.api);
      if (!isNewBlock(props.lastBlock.blockNumber, lastBlock.blockNumber)) {
        await sleep(BLOCK_TIME);
        continue;
      }
      props.lastBlock = lastBlock;

      log(`Block ${props.lastBlock.blockNumber}: processing`);

      // TODO: do this in a better way
      const subnets = await querySubnetParams(props.lastBlock.apiAtBlock);
      const subnetData = subnets.map((subnet) =>
        SubnetToDatabase(subnet, props.lastBlock.blockNumber),
      );
      log(
        `Block ${props.lastBlock.blockNumber}: upserting  ${subnetData.length} subnets`,
      );
      await upsertSubnetData(subnetData);

      log(
        `Block ${props.lastBlock.blockNumber}: module data upserted in ${(new Date().getTime() - currentTime.getTime()) / 1000} seconds`,
      );
    } catch (e) {
      log("UNEXPECTED ERROR: ", e);
      await sleep(BLOCK_TIME);
      continue;
    }
  }
}
