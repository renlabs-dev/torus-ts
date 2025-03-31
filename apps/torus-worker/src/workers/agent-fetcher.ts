import type { LastBlock, Proposal, SS58Address } from "@torus-network/sdk";
import {
  checkSS58,
  CONSTANTS,
  queryAgents,
  queryLastBlock,
  queryWhitelist,
} from "@torus-network/sdk";
import type { WorkerProps } from "../common";
import {
  agentApplicationToApplication,
  agentProposalToProposal,
  getApplications,
  getProposals,
  isNewBlock,
  log,
  sleep,
  getProposalStatus,
  normalizeApplicationValue,
} from "../common";
import type { NewApplication, NewProposal } from "../db";
import {
  SubspaceAgentToDatabase,
  upsertAgentData,
  upsertProposal,
  upsertWhitelistApplication,
  queryProposalsDB,
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
  const dbApplications: NewApplication[] = [];
  applicationsMap.forEach((value, _) => {
    dbApplications.push(agentApplicationToApplication(value));
  });
  log(
    `Block ${lastBlock.blockNumber}: upserting ${dbApplications.length} applications`,
  );
  await upsertWhitelistApplication(dbApplications);
  log(`Block ${lastBlock.blockNumber}: applications upserted`);
}


export async function runProposalsFetch(lastBlock: LastBlock) {
  log(`Block ${lastBlock.blockNumber}: running proposals fetch`);
  const savedProposalsMap = new Map ((await queryProposalsDB()).map(proposal => [proposal.proposalID, proposal]));

  const isProposalToInsert = (a: Proposal) => {
    const existingProposal = savedProposalsMap.get(a.id);
    const isNewProposal = !existingProposal;
    const hasStatusChanged = !isNewProposal && getProposalStatus(a) !== normalizeApplicationValue(existingProposal.status);
    return isNewProposal || hasStatusChanged;
};

  const proposals = await getProposals(lastBlock.apiAtBlock, isProposalToInsert);
  const proposalsMap = new Map(Object.entries(proposals));
  const dbProposals: NewProposal[] = [];
  proposalsMap.forEach((value, _) => {
    dbProposals.push(agentProposalToProposal(value));
  });
  log(
    `Block ${lastBlock.blockNumber}: upserting ${dbProposals.length} proposals`,
  );
  await upsertProposal(dbProposals);
  log(`Block ${lastBlock.blockNumber}: proposals upserted`);
}

export async function agentFetcherWorker(props: WorkerProps) {
  while (true) {
    try {
      const lastBlock = await queryLastBlock(props.api);

      // Check if the last queried block is a new block
      if (!isNewBlock(props.lastBlock.blockNumber, lastBlock.blockNumber)) {
        await sleep(CONSTANTS.TIME.BLOCK_TIME_MILLISECONDS);
        continue;
      }
      props.lastBlock = lastBlock;
      log(`Block ${lastBlock.blockNumber}: processing`);

      await runAgentFetch(lastBlock);
      await runApplicationsFetch(lastBlock);
      await runProposalsFetch(lastBlock);
    } catch (e) {
      log("UNEXPECTED ERROR: ", e);
      await sleep(CONSTANTS.TIME.BLOCK_TIME_MILLISECONDS);
    }
  }
}
