import type { WorkerProps } from "../common";
import { isNewBlock, log, sleep } from "../common";
import { SubspaceAgentToDatabase, upsertAgentData } from "../db";
import type { SS58Address } from "@torus-ts/subspace";
import {
  checkSS58,
  queryAgents,
  queryLastBlock,
  queryWhitelist,
} from "@torus-ts/subspace";
import { CONSTANTS } from "@torus-ts/subspace";

export async function agentFetcherWorker(props: WorkerProps) {
  while (true) {
    try {
      const currentTime = new Date();
      const lastBlock = await queryLastBlock(props.api);

      // Check if the last queried block is a new block
      if (!isNewBlock(props.lastBlock.blockNumber, lastBlock.blockNumber)) {
        await sleep(CONSTANTS.TIME.BLOCK_TIME_MILLISECONDS);
        continue;
      }
      props.lastBlock = lastBlock;

      const api = lastBlock.apiAtBlock;
      const blockNumber = lastBlock.blockNumber;

      log(`Block ${lastBlock.blockNumber}: processing`);

      const whitelist = new Set(await queryWhitelist(api));
      const isWhitelisted = (addr: SS58Address) => whitelist.has(addr);

      const agentsMap = await queryAgents(api);
      const agents = [...agentsMap.values()];
      const agentsData = agents.map((agent) =>
        SubspaceAgentToDatabase(
          agent,
          blockNumber,
          isWhitelisted(checkSS58(agent.key)),
        ),
      );
      log(`Block ${lastBlock.blockNumber}: upserting ${agents.length} agents`);

      await upsertAgentData(agentsData);

      log(
        `Block ${lastBlock.blockNumber}: agent data upserted in ${(new Date().getTime() - currentTime.getTime()) / 1000} seconds`,
      );
    } catch (e) {
      log("UNEXPECTED ERROR: ", e);
      await sleep(CONSTANTS.TIME.BLOCK_TIME_MILLISECONDS);
    }
  }
}
