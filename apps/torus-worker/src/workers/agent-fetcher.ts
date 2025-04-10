import type { LastBlock, Proposal, SS58Address } from "@torus-network/sdk";
import {
  checkSS58,
  CONSTANTS,
  queryAgents,
  queryLastBlock,
  queryWhitelist,
} from "@torus-network/sdk";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import type { WorkerProps } from "../common";
import {
  agentApplicationToApplication,
  agentProposalToProposal,
  getApplications,
  getProposals,
  getProposalStatus,
  normalizeApplicationValue,
  sleep,
} from "../common";
import { createLogger } from "../common/log";
import type { NewApplication, NewProposal } from "../db";
import {
  queryProposalsDB,
  SubspaceAgentToDatabase,
  upsertAgentData,
  upsertProposal,
  upsertWhitelistApplication,
} from "../db";

const log = createLogger({ name: "agent-fetcher" });

// Constants for error handling configuration
const retryDelay = CONSTANTS.TIME.BLOCK_TIME_MILLISECONDS;

/**
 * Fetches and processes agent data for a given block.
 *
 * @param lastBlock - The latest block data.
 */
export async function runAgentFetch(lastBlock: LastBlock) {
  const startTime = new Date();
  const api = lastBlock.apiAtBlock;
  const blockNumber = lastBlock.blockNumber;

  log.info(`Block ${blockNumber}: running agent fetch`);

  const [whitelistError, whitelist] = await tryAsync(queryWhitelist(api));
  const [agentsError, agentsMap] = await tryAsync(queryAgents(api));
  if (whitelistError !== undefined || agentsError !== undefined) {
    log.error(whitelistError ?? agentsError);
    return;
  }

  const whitelistSet = new Set(whitelist);
  const isWhitelisted = (addr: SS58Address) => whitelistSet.has(addr);
  const agents = [...agentsMap.values()];
  const agentsData = agents.map((agent) =>
    SubspaceAgentToDatabase(
      agent,
      blockNumber,
      isWhitelisted(checkSS58(agent.key)),
    ),
  );

  log.info(`Block ${blockNumber}: upserting ${agents.length} agents`);

  const [upsertAgentDataError, _] = await tryAsync(upsertAgentData(agentsData));
  if (upsertAgentDataError !== undefined) {
    log.error(upsertAgentDataError);
    return;
  }

  const timeDelta = new Date().getTime() - startTime.getTime();
  log.info(
    `Block ${blockNumber}: agent data upserted in ${timeDelta / 1000} seconds`,
  );
}

/**
 * Fetches and processes applications data for a given block
 * @param lastBlock - The latest block data
 */
export async function runApplicationsFetch(lastBlock: LastBlock) {
  const lastBlockNumber = lastBlock.blockNumber;
  log.info(`Block ${lastBlockNumber}: running applications fetch`);

  const [getApplicationsError, applications] = await tryAsync(
    getApplications(lastBlock.apiAtBlock, (_) => true),
  );
  if (getApplicationsError !== undefined) {
    log.error(getApplicationsError);
    return;
  }

  const applicationsMap = new Map(Object.entries(applications));
  const dbApplications: NewApplication[] = [];
  applicationsMap.forEach((value, _) => {
    dbApplications.push(agentApplicationToApplication(value));
  });

  log.info(
    `Block ${lastBlockNumber}: upserting ${dbApplications.length} applications`,
  );

  const [upsertWhitelistApplicationError, _] = await tryAsync(
    upsertWhitelistApplication(dbApplications),
  );
  if (upsertWhitelistApplicationError === undefined) {
    log.info(`Block ${lastBlockNumber}: applications upserted`);
  }
}

/**
 * Fetches and updates proposals based on the last processed block
 *
 * @param lastBlock - The last processed block information
 *
 * The function:
 * 1. Queries existing proposals from DB
 * 2. Gets new proposals from blockchain for the given block
 * 3. Identifies proposals that are new or have status changes
 * 4. Upserts the identified proposals to DB
 */
export async function runProposalsFetch(lastBlock: LastBlock) {
  const lastBlockNumber = lastBlock.blockNumber;
  log.info(`Block ${lastBlockNumber}: running proposals fetch`);

  const [queryProposalsError, queryProposalsResult] =
    await tryAsync(queryProposalsDB());
  if (queryProposalsError !== undefined) {
    log.error(queryProposalsError);
    return;
  }

  const savedProposalsMap = new Map(
    queryProposalsResult.map((proposal) => [proposal.id, proposal]),
  );
  const isProposalToInsert = (a: Proposal) => {
    const existingProposal = savedProposalsMap.get(a.id);
    const isNewProposal = !existingProposal;
    const hasStatusChanged =
      !isNewProposal &&
      getProposalStatus(a) !==
        normalizeApplicationValue(existingProposal.status);
    return isNewProposal || hasStatusChanged;
  };

  const [getProposalsError, proposalsResult] = await tryAsync(
    getProposals(lastBlock.apiAtBlock, isProposalToInsert),
  );
  if (getProposalsError !== undefined) {
    log.error(getProposalsError);
    return;
  }

  const proposalsMap = new Map(Object.entries(proposalsResult));
  const dbProposals: NewProposal[] = [];
  proposalsMap.forEach((value, _) => {
    dbProposals.push(agentProposalToProposal(value));
  });

  log.info(
    `Block ${lastBlockNumber}: upserting ${dbProposals.length} proposals`,
  );

  const [upsertProposalError, _] = await tryAsync(upsertProposal(dbProposals));
  if (upsertProposalError !== undefined) {
    log.error(upsertProposalError);
    return;
  }

  log.info(`Block ${lastBlockNumber}: proposals upserted`);
}

/**
 * Main worker function that fetches and processes block data continuously
 * @param props Worker properties including API connection
 */
export async function agentFetcherWorker(props: WorkerProps) {
  while (true) {
    const [fetchWorkerError, _] = await tryAsync(
      (async () => {
        // Get latest block information with error logging
        const [queryLastBlockError, lastBlock] = await tryAsync(
          queryLastBlock(props.api),
        );
        if (queryLastBlockError !== undefined) {
          log.error(queryLastBlockError);
          await sleep(CONSTANTS.TIME.BLOCK_TIME_MILLISECONDS);
          return;
        }

        const lastBlockNumber = lastBlock.blockNumber;

        // Check if the last queried block is a new block
        if (props.lastBlock.blockNumber === lastBlockNumber) {
          log.info(
            `Block ${props.lastBlock.blockNumber}: already processed, skipping`,
          );
          await sleep(CONSTANTS.TIME.BLOCK_TIME_MILLISECONDS);
          return;
        }
        props.lastBlock = lastBlock;

        log.info(`Block ${lastBlockNumber}: processing`);

        await runAgentFetch(lastBlock);
        await runApplicationsFetch(lastBlock);
        await runProposalsFetch(lastBlock);
      })(),
    );
    if (fetchWorkerError !== undefined) {
      log.error(fetchWorkerError);
      await sleep(retryDelay);
    }
  }
}
