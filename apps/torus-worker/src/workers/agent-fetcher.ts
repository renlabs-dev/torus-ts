import type { SS58Address } from "@torus-ts/subspace";
import {
  checkSS58,
  queryLastBlock,
  queryRegisteredModulesInfo,
  queryWhitelist,
} from "@torus-ts/subspace";

import type { WorkerProps } from "../common";
import {
  BLOCK_TIME,
  CONSENSUS_NETUID,
  isNewBlock,
  log,
  sleep,
} from "../common";
import { upsertAgentData } from "../db";
import { SubspaceAgentToDatabase } from "../db/type-transformations.js";

export async function agentFetcherWorker(props: WorkerProps) {
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

      const agents = await queryRegisteredModulesInfo(
        lastBlock.apiAtBlock,
        CONSENSUS_NETUID,
        props.lastBlock.blockNumber,
      );
      const agentsData = agents.map((agent) =>
        SubspaceAgentToDatabase(
          agent,
          lastBlock.blockNumber,
          isWhitelisted(checkSS58(agent.key)),
        ),
      );
      log(`Block ${lastBlock.blockNumber}: upserting  ${agents.length} agents`);

      await upsertAgentData(agentsData);

      log(
        `Block ${lastBlock.blockNumber}: agent data upserted in ${(new Date().getTime() - currentTime.getTime()) / 1000} seconds`,
      );
    } catch (e) {
      log("UNEXPECTED ERROR: ", e);
      await sleep(BLOCK_TIME);
      continue;
    }
  }
}
