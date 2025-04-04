import type { LastBlock, Proposal, SS58Address } from "@torus-network/sdk";
import {
  checkSS58,
  CONSTANTS,
  queryAgents,
  queryLastBlock,
  queryWhitelist,
} from "@torus-network/sdk";
import { tryAsyncLoggingRaw } from "@torus-ts/utils/error-helpers/server-operations";
import type { WorkerProps } from "../common";
import {
  agentApplicationToApplication,
  agentProposalToProposal,
  getApplications,
  getProposals,
  getProposalStatus,
  isNewBlock,
  log,
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

// Constants for error handling configuration
const defaultRetries = 3;
const retryDelay = CONSTANTS.TIME.BLOCK_TIME_MILLISECONDS;

/**
 * Fetches and processes agent data for a given block
 * @param lastBlock The latest block data
 */
export async function runAgentFetch(lastBlock: LastBlock) {
  const currentTime = new Date();
  const api = lastBlock.apiAtBlock;
  const blockNumber = lastBlock.blockNumber;

  log(`Block ${lastBlock.blockNumber}: running agent fetch`);

  // ==========================
  // ===== Error Handling =====
  // ==========================
  let retries = defaultRetries;
  let whitelist: Set<string> | undefined;
  let agentsMapSet;
  let lastError: unknown;

  // Retry loop for fetching whitelist and agents data
  while (retries > 0) {
    if (lastError) {
      log(
        `Error: ${lastError instanceof Error ? (lastError.stack ?? lastError.message) : JSON.stringify(lastError)}, (${retries} retries left)`,
      );
    }

    const [whitelistError, whitelistResult] = await tryAsyncLoggingRaw(
      queryWhitelist(api),
    );
    const [agentsError, agentsResult] = await tryAsyncLoggingRaw(
      queryAgents(api),
    );

    if (!whitelistError && !agentsError) {
      agentsMapSet = agentsResult;
      whitelist = new Set(whitelistResult);
      break;
    } else {
      lastError = whitelistError ?? agentsError;
      retries--;
      await sleep(retryDelay);
    }
  }

  if (retries === 0 && lastError) {
    log("Failed to fetch agent data after multiple attempts");
    return;
  }

  if (!whitelist || !agentsMapSet) {
    log("Whitelist or agents data is undefined");
    return;
  }

  // ==========================
  const isWhitelisted = (addr: SS58Address) => whitelist.has(addr);
  const agents = [...agentsMapSet.values()];
  const agentsData = agents.map((agent) =>
    SubspaceAgentToDatabase(
      agent,
      blockNumber,
      isWhitelisted(checkSS58(agent.key)),
    ),
  );
  log(`Block ${lastBlock.blockNumber}: upserting ${agents.length} agents`);

  // Error handling for database operation
  const [upsertError, _upsertSuccess] = await tryAsyncLoggingRaw(
    upsertAgentData(agentsData),
  );

  if (upsertError) {
    log(
      `Error upserting agents: ${upsertError instanceof Error ? (upsertError.stack ?? upsertError.message) : JSON.stringify(upsertError)}`,
    );
    return;
  }

  log(
    `Block ${lastBlock.blockNumber}: agent data upserted in ${(new Date().getTime() - currentTime.getTime()) / 1000} seconds`,
  );
}

/**
 * Fetches and processes applications data for a given block
 * @param lastBlock The latest block data
 */
export async function runApplicationsFetch(lastBlock: LastBlock) {
  log(`Block ${lastBlock.blockNumber}: running applications fetch`);

  // ==========================
  // ===== Error Handling =====
  // ==========================
  let retries = defaultRetries;
  let applications;
  let lastError: unknown;

  while (retries > 0) {
    const [applicationsError, applicationsResult] = await tryAsyncLoggingRaw(
      getApplications(lastBlock.apiAtBlock, (_) => true),
    );

    if (!applicationsError) {
      applications = applicationsResult;
      break;
    }

    lastError = applicationsError;
    log(
      `Error fetching applications: ${lastError instanceof Error ? (lastError.stack ?? lastError.message) : JSON.stringify(lastError)}, (${retries} retries left)`,
    );
    retries--;
    await sleep(retryDelay);
  }

  if (retries === 0 && lastError) {
    log("Failed to fetch applications after multiple attempts");
    return;
  }

  if (!applications) {
    log("Applications is undefined");
    return;
  }
  // ==========================

  const applicationsMap = new Map(Object.entries(applications));
  const dbApplications: NewApplication[] = [];
  applicationsMap.forEach((value, _) => {
    dbApplications.push(agentApplicationToApplication(value));
  });

  log(
    `Block ${lastBlock.blockNumber}: upserting ${dbApplications.length} applications`,
  );
  // Error handling for database operation
  const [upsertError] = await tryAsyncLoggingRaw(
    upsertWhitelistApplication(dbApplications),
  );
  if (upsertError) {
    log(
      `Error upserting applications: ${upsertError instanceof Error ? (upsertError.stack ?? upsertError.message) : JSON.stringify(upsertError)}`,
    );
    return;
  }
  log(`Block ${lastBlock.blockNumber}: applications upserted`);
}
export async function runProposalsFetch(lastBlock: LastBlock) {
  log(`Block ${lastBlock.blockNumber}: running proposals fetch`);

  const [queryProposalsError, dbSuccess] =
    await tryAsyncLoggingRaw(queryProposalsDB());
  if (queryProposalsError) {
    log(
      `Error fetching proposals from db: ${queryProposalsError instanceof Error ? (queryProposalsError.stack ?? queryProposalsError.message) : JSON.stringify(queryProposalsError)}`,
    );
    return;
  }

  const savedProposalsMap = new Map(
    dbSuccess.map((proposal) => [proposal.proposalID, proposal]),
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

  // ==========================
  // ===== Error Handling =====
  // ==========================
  let retries = defaultRetries;
  let proposals;
  let lastError: unknown;

  while (retries > 0) {
    const [getProposalsError, proposalsResult] = await tryAsyncLoggingRaw(
      getProposals(lastBlock.apiAtBlock, isProposalToInsert),
    );

    if (!getProposalsError) {
      proposals = proposalsResult;
      break;
    }

    lastError = getProposalsError;
    log(
      `Error fetching proposals from api: ${lastError instanceof Error ? (lastError.stack ?? lastError.message) : JSON.stringify(lastError)}, (${retries} retries left)`,
    );
    retries--;
    await sleep(retryDelay);
  }

  if (retries === 0 && lastError) {
    log("Failed to fetch proposals after multiple attempts");
    return;
  }

  if (!proposals) {
    log("No proposals found in api");
    return;
  }
  const proposalsMap = new Map(Object.entries(proposals));
  const dbProposals: NewProposal[] = [];
  proposalsMap.forEach((value, _) => {
    dbProposals.push(agentProposalToProposal(value));
  });
  log(
    `Block ${lastBlock.blockNumber}: upserting ${dbProposals.length} proposals`,
  );
  const [upsertError] = await tryAsyncLoggingRaw(upsertProposal(dbProposals));
  if (upsertError) {
    log(
      `Error upserting proposals: ${upsertError instanceof Error ? (upsertError.stack ?? upsertError.message) : JSON.stringify(upsertError)}`,
    );
    return;
  }
  log(`Block ${lastBlock.blockNumber}: proposals upserted`);
}

/**
 * Main worker function that fetches and processes block data continuously
 * @param props Worker properties including API connection
 */
export async function agentFetcherWorker(props: WorkerProps) {
  while (true) {
    const [error] = await tryAsyncLoggingRaw(
      (async () => {
        // Get latest block information
        const [blockError, lastBlock] = await tryAsyncLoggingRaw(
          queryLastBlock(props.api),
        );
        if (blockError) {
          log(
            `Error fetching last block: ${blockError instanceof Error ? (blockError.stack ?? blockError.message) : JSON.stringify(blockError)}`,
          );
          await sleep(retryDelay);
          return;
        }
        // Check if the last queried block is a new block
        if (!isNewBlock(props.lastBlock.blockNumber, lastBlock.blockNumber)) {
          await sleep(retryDelay);
          return;
        }

        props.lastBlock = lastBlock;
        log(`Block ${lastBlock.blockNumber}: processing`);

        // Run all data fetching and processing operations
        await runAgentFetch(lastBlock);
        await runApplicationsFetch(lastBlock);
        await runProposalsFetch(lastBlock);
      })(),
    );

    if (error) {
      log("UNEXPECTED ERROR: ", error);
      await sleep(retryDelay);
    }
  }
}
