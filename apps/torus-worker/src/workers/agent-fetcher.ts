import type { LastBlock, SS58Address } from "@torus-ts/subspace";
import {
  checkSS58,
  queryAgents,
  queryLastBlock,
  queryWhitelist,
} from "@torus-ts/subspace";

import type { WorkerProps } from "../common";
import {
  BLOCK_TIME,
  isNewBlock,
  log,
  sleep,
  getApplications,
  agentApplicationToApplication,
} from "../common";
import type { Application } from "../db";
import {
  SubspaceAgentToDatabase,
  upsertAgentData,
  upsertWhitelistApplication,
} from "../db";

export async function runAgentFetch(lastBlock: LastBlock) {
  const currentTime = new Date();
  const api = lastBlock.apiAtBlock;
  const blockNumber = lastBlock.blockNumber;

  log(`Block ${lastBlock.blockNumber}: running agent fetch`);

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
}

export async function runApplicationsFetch(lastBlock: LastBlock) {
  log(`Block ${lastBlock.blockNumber}: running applications fetch`);
  const applications = await getApplications(lastBlock.apiAtBlock, (_) => true);
  const applicationsMap = new Map(Object.entries(applications));
  const dbApplications: Application[] = [];
  applicationsMap.forEach((value, _) => {
    dbApplications.push(agentApplicationToApplication(value));
  });
  log(`Block ${lastBlock.blockNumber}: upserting ${dbApplications.length} applications`);
  await upsertWhitelistApplication(dbApplications);
  log(`Block ${lastBlock.blockNumber}: applications upserted`);
}

export async function agentFetcherWorker(props: WorkerProps) {
  while (true) {
    try {
      const lastBlock = await queryLastBlock(props.api);

      // Check if the last queried block is a new block
      if (!isNewBlock(props.lastBlock.blockNumber, lastBlock.blockNumber)) {
        await sleep(BLOCK_TIME);
        continue;
      }
      props.lastBlock = lastBlock;
      log(`Block ${lastBlock.blockNumber}: processing`);

      await runAgentFetch(lastBlock);
      await runApplicationsFetch(lastBlock);
    } catch (e) {
      log("UNEXPECTED ERROR: ", e);
      await sleep(BLOCK_TIME);
    }
  }
}
