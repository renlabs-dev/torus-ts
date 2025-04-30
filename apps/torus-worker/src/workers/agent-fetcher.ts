import type { LastBlock, Proposal, SS58Address } from "@torus-network/sdk";
import {
  checkSS58,
  CONSTANTS,
  queryAgents,
  queryLastBlock,
  queryWhitelist,
} from "@torus-network/sdk";
import { BasicLogger } from "@torus-network/torus-utils/logger";
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
import type { NewApplication, NewProposal } from "../db";
import {
  queryProposalsDB,
  SubspaceAgentToDatabase,
  upsertAgentData,
  upsertProposal,
  upsertWhitelistApplication,
} from "../db";

const log = BasicLogger.create({ name: "agent-fetcher" });

// Constants for error handling configuration
const retryDelay = CONSTANTS.TIME.BLOCK_TIME_MILLISECONDS;

/**
 * Synchronizes on-chain agent data to the database for a given block height.
 * Handles whitelist status checks and transforms blockchain data to database format.
 *
 * @param lastBlock - Contains blockchain API instance frozen at a specific block height
 */
export async function runAgentFetch(lastBlock: LastBlock) {
  const startTime = new Date();
  const api = lastBlock.apiAtBlock;
  const blockNumber = lastBlock.blockNumber;

  log.info(`Block ${blockNumber}: running agent fetch`);

  const whitelistRes = await tryAsync(queryWhitelist(api));
  if (log.ifResultIsErr(whitelistRes)) return;
  const [_whitelistErr, whitelist] = whitelistRes;

  const agentsRes = await tryAsync(queryAgents(api));
  if (log.ifResultIsErr(agentsRes)) return;
  const [_agentsErr, agentsMap] = agentsRes;

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

  const upserAgentDataRes = await tryAsync(upsertAgentData(agentsData));
  if (log.ifResultIsErr(upserAgentDataRes)) return;

  const timeDelta = new Date().getTime() - startTime.getTime();
  log.info(
    `Block ${blockNumber}: agent data upserted in ${timeDelta / 1000} seconds`,
  );
}

/**
 * Captures all whitelist applications from the blockchain at a specific block height.
 * This always processes the complete set of applications to maintain full audit history.
 *
 * @param lastBlock - Contains blockchain API instance frozen at a specific block height
 */
export async function runApplicationsFetch(lastBlock: LastBlock) {
  const lastBlockNumber = lastBlock.blockNumber;
  log.info(`Block ${lastBlockNumber}: running applications fetch`);

  const applicationsRes = await tryAsync(
    getApplications(lastBlock.apiAtBlock, (_) => true),
  );
  if (log.ifResultIsErr(applicationsRes)) return;
  const [_applicationsErr, applications] = applicationsRes;

  const applicationsMap = new Map(Object.entries(applications));
  const dbApplications: NewApplication[] = [];
  applicationsMap.forEach((value, _) => {
    dbApplications.push(agentApplicationToApplication(value));
  });

  log.info(
    `Block ${lastBlockNumber}: upserting ${dbApplications.length} applications`,
  );

  const upsertWhitelistApplicationRes = await tryAsync(
    upsertWhitelistApplication(dbApplications),
  );
  if (log.ifResultIsErr(upsertWhitelistApplicationRes)) return;
  log.info(`Block ${lastBlockNumber}: applications upserted`);
}

/**
 * Performs differential synchronization of blockchain proposals to database.
 * Optimizes database operations by only processing proposals that are new or have
 * changed status since the last sync.
 *
 * @param lastBlock - Contains blockchain API instance frozen at a specific block height
 */
export async function runProposalsFetch(lastBlock: LastBlock) {
  const lastBlockNumber = lastBlock.blockNumber;
  log.info(`Block ${lastBlockNumber}: running proposals fetch`);

  const queryProposalsRes = await tryAsync(queryProposalsDB());
  if (log.ifResultIsErr(queryProposalsRes)) return;
  const [_queryProposalsError, queryProposalsResult] = queryProposalsRes;

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

  const getProrposalsRes = await tryAsync(
    getProposals(lastBlock.apiAtBlock, isProposalToInsert),
  );
  if (log.ifResultIsErr(getProrposalsRes)) return;
  const [_getProposalsError, proposalsResult] = getProrposalsRes;

  const proposalsMap = new Map(Object.entries(proposalsResult));
  const dbProposals: NewProposal[] = [];
  proposalsMap.forEach((value, _) => {
    dbProposals.push(agentProposalToProposal(value));
  });

  log.info(
    `Block ${lastBlockNumber}: upserting ${dbProposals.length} proposals`,
  );

  const upsertProposalRes = await tryAsync(upsertProposal(dbProposals));
  if (log.ifResultIsErr(upsertProposalRes)) return;

  log.info(`Block ${lastBlockNumber}: proposals upserted`);
}

/**
 * Blockchain data synchronization in an infinite loop.
 * Processes each new block once, skips already processed blocks, and handles
 * all errors internally to ensure the synchronization process never terminates.
 *
 * @param props - Contains API connection and state for tracking the last processed block
 */
export async function agentFetcherWorker(props: WorkerProps) {
  while (true) {
    const fetchWorkerRes = await tryAsync(
      (async () => {
        // Get latest block information with error logging
        const queryLastBlockRes = await tryAsync(queryLastBlock(props.api));
        if (log.ifResultIsErr(queryLastBlockRes)) {
          await sleep(CONSTANTS.TIME.BLOCK_TIME_MILLISECONDS);
          return;
        }
        const [_queryLastBlockError, lastBlock] = queryLastBlockRes;

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
    if (log.ifResultIsErr(fetchWorkerRes)) {
      await sleep(retryDelay);
    }
  }
}
