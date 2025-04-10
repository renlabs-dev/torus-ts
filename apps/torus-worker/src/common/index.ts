import type { ApiPromise } from "@polkadot/api";
import type {
  AgentApplication,
  Api,
  LastBlock,
  Proposal,
} from "@torus-network/sdk";
import {
  CONSTANTS,
  queryAgentApplications,
  queryLastBlock,
  queryProposals,
} from "@torus-network/sdk";
import { applicationStatusValues } from "@torus-ts/db/schema";
import { tryAsync } from "@torus-ts/utils/try-catch";
import { match } from "rustie";
import type {
  ApplicationDB,
  CadreCandidate,
  NewApplication,
  NewProposal,
  VotesByNumericId as VoteById,
  VotesByKey as VoteByKey,
} from "../db";
import {
  addCadreMember,
  countCadreKeys,
  getCadreDiscord,
  pendingPenalizations,
  queryAgentApplicationsDB,
  queryCadreCandidates,
  queryProposalsDB,
  queryTotalVotesPerApp,
  queryTotalVotesPerCadre,
  refuseCadreApplication,
  removeCadreMember,
} from "../db";
import { createLogger } from "./log";

/**
 * @deprecated
 */
export interface WorkerProps {
  lastBlockNumber: number;
  lastBlock: LastBlock;
  api: ApiPromise;
}

const log = createLogger({ name: "common-index" });

// ---- Constants ----

export const APPLICATION_EXPIRATION_TIME =
  CONSTANTS.TIME.BLOCK_TIME_SECONDS * CONSTANTS.TIME.ONE_WEEK; // 7 days in blocks

// ---- Helpers ----

/**
 * Creates a promise that resolves after the specified duration
 *
 * @param ms - The time to sleep in milliseconds
 * @returns A promise that resolves after the specified delay
 */
export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Waits until a new block is available on the blockchain
 *
 * @param props - Worker properties containing API connection and last block info
 * @returns The new block data once available
 */
export async function sleepUntilNewBlock(props: WorkerProps) {
  while (true) {
    const [queryLastBlockError, currentBlock] = await tryAsync(
      queryLastBlock(props.api),
    );
    if (queryLastBlockError !== undefined) {
      log.error(queryLastBlockError);
      await sleep(CONSTANTS.TIME.BLOCK_TIME_MILLISECONDS);
      continue;
    }

    const blockNumber = currentBlock.blockNumber;
    if (props.lastBlock.blockNumber === blockNumber) {
      log.info(`Block ${blockNumber} already processed, skipping`);
      await sleep(CONSTANTS.TIME.BLOCK_TIME_MILLISECONDS);
    } else {
      return currentBlock;
    }
  }
}

// ---- DAO Applications ----

// TODO: refactor out

type ApplicationVoteStatus = "open" | "accepted" | "locked";

/**
 * Converts an agent application from the blockchain format to database format
 *
 * @param agentApplication - The agent application data from blockchain
 * @returns A database-compatible application object
 */
export function agentApplicationToApplication(
  agentApplication: AgentApplication,
): NewApplication {
  const mappedStatus = match(agentApplication.status)({
    Open: () => applicationStatusValues.Open,
    Resolved: ({ accepted }) =>
      accepted
        ? applicationStatusValues.Accepted
        : applicationStatusValues.Rejected,
    Expired: () => applicationStatusValues.Rejected,
  });

  return {
    ...agentApplication,
    cost: agentApplication.cost.toString(),
    status: mappedStatus,
  };
}

/**
 * Converts a proposal from blockchain format to database format
 *
 * @param proposal - The proposal data from blockchain
 * @returns A database-compatible proposal object
 */
export function agentProposalToProposal(proposal: Proposal): NewProposal {
  const status = match(proposal.status)({
    Open: () => applicationStatusValues.Open,
    Accepted: () => applicationStatusValues.Accepted,
    Expired: () => applicationStatusValues.Expired,
    Refused: () => applicationStatusValues.Rejected,
  });
  return {
    proposalID: proposal.id,
    expirationBlock: proposal.expirationBlock,
    status: status,
    proposerKey: proposal.proposer,
    creationBlock: proposal.creationBlock,
    metadataUri: proposal.metadata,
    proposalCost: proposal.proposalCost.toString(),
    notified: false, // Default value as specified in schema
  };
}

/**
 * Normalizes application status values for consistency between database and blockchain
 *
 * @param value - The application status value to normalize
 * @returns The normalized application status value
 */
export function normalizeApplicationValue(
  value: string,
): keyof typeof applicationStatusValues {
  switch (value.toLowerCase()) {
    case "open":
      return "Open";
    case "accepted":
      return "Accepted";
    case "rejected":
      return "Rejected";
    case "expired":
      return "Expired";
    default:
      throw new Error(`Invalid value ${value} for application status`);
  }
}

/**
 * Gets the status of a proposal in the normalized format
 *
 * @param proposal - The proposal to get the status for
 * @returns The normalized proposal status
 */
export function getProposalStatus(proposal: Proposal) {
  const status = match(proposal.status)({
    Open: () => applicationStatusValues.Open,
    Accepted: () => applicationStatusValues.Accepted,
    Expired: () => applicationStatusValues.Expired,
    Refused: () => applicationStatusValues.Rejected,
  });
  return status;
}

/**
 * Determines the vote status of an application
 *
 * @param app - The agent application to check
 * @returns The vote status (open, accepted, or locked)
 */
export const getApplicationVoteStatus = (
  app: AgentApplication,
): ApplicationVoteStatus =>
  match(app.status)({
    Open: () => "open",
    Resolved: ({ accepted }) => (accepted ? "accepted" : "locked"),
    Expired: () => "locked",
  });

/**
 * Checks if an application is in a pending state (not locked)
 *
 * @param app - The application to check
 * @returns True if the application is pending, false otherwise
 */
export const applicationIsPending = (app: AgentApplication) =>
  getApplicationVoteStatus(app) != "locked";

/**
 * Checks if an application is in an open state
 *
 * @param app - The application to check
 * @returns True if the application is open, false otherwise
 */
export const applicationIsOpen = (app: AgentApplication) =>
  match(app.status)({
    Open: () => true,
    Resolved: ({ accepted }) => accepted,
    Expired: () => false,
  });

/**
 * Fetches applications from the blockchain that match the given filter
 *
 * @param api - The blockchain API instance
 * @param filterFn - Function to filter applications
 * @returns A map of application IDs to application objects
 */
export async function getApplications(
  api: Api,
  filterFn: (app: AgentApplication) => boolean,
) {
  const [queryApplicationsError, application_entries] = await tryAsync(
    queryAgentApplications(api),
  );
  if (queryApplicationsError !== undefined) {
    log.error(queryApplicationsError);
    return {};
  }

  const pending_daos = application_entries.filter(filterFn);
  const applications_map: Record<number, AgentApplication> =
    pending_daos.reduce(
      (hashmap, dao) => {
        hashmap[dao.id] = dao;
        return hashmap;
      },
      {} as Record<number, AgentApplication>,
    );
  return applications_map;
}

/**
 * Fetches proposals from the blockchain that match the given filter
 *
 * @param api - The blockchain API instance
 * @param filterFn - Function to filter proposals
 * @returns A map of proposal IDs to proposal objects
 */
export async function getProposals(
  api: Api,
  filterFn: (app: Proposal) => boolean,
) {
  const [queryProposalsError, proposals_entries] = await tryAsync(
    queryProposals(api),
  );
  if (queryProposalsError !== undefined) {
    log.error(queryProposalsError);
    return {};
  }

  const desired_proposals = proposals_entries.filter(filterFn);
  const proposals_map: Record<number, Proposal> = desired_proposals.reduce(
    (hashmap, proposal) => {
      hashmap[proposal.id] = proposal;
      return hashmap;
    },
    {} as Record<number, Proposal>,
  );
  return proposals_map;
}

/**
 * Retrieves proposals from the database that match the given filter
 *
 * @param filterFn - Function to filter proposals
 * @returns An array of filtered proposals
 */
export async function getProposalsDB(filterFn: (app: NewProposal) => boolean) {
  const [queryProposalsDBError, proposals] = await tryAsync(queryProposalsDB());
  if (queryProposalsDBError !== undefined) {
    log.error(queryProposalsDBError);
    return [];
  }

  const pending_daos = proposals.filter(filterFn);
  return pending_daos;
}

/**
 * Retrieves applications from the database that match the given filter
 *
 * @param filterFn - Function to filter applications
 * @returns An array of filtered applications
 */
export async function getApplicationsDB(
  filterFn: (app: ApplicationDB) => boolean,
) {
  const [queryApplicationsDBError, applications] = await tryAsync(
    queryAgentApplicationsDB(),
  );
  if (queryApplicationsDBError !== undefined) {
    log.error(queryApplicationsDBError);
    return [];
  }

  const pending_daos = applications.filter(filterFn);
  return pending_daos;
}

/**
 * Retrieves cadre candidates from the database that match the given filter
 *
 * @param filterFn - Function to filter cadre candidates
 * @returns An array of filtered cadre candidates
 */
export async function getCadreCandidates(
  filterFn: (app: CadreCandidate) => boolean,
) {
  const [queryCadreCandidatesError, cadreCandidates] = await tryAsync(
    queryCadreCandidates(),
  );
  if (queryCadreCandidatesError !== undefined) {
    log.error(queryCadreCandidatesError);
    return [];
  }

  return cadreCandidates.filter(filterFn);
}

/**
 * Retrieves votes on pending applications
 *
 * @param applications_map - Map of application IDs to application objects
 * @param last_block_number - The last processed block number
 * @returns An array of votes on pending applications
 */
export async function getVotesOnPending(
  applications_map: Record<number, AgentApplication>,
  last_block_number: number,
): Promise<VoteById[]> {
  const [queryVotesError, votes] = await tryAsync(queryTotalVotesPerApp());
  if (queryVotesError !== undefined) {
    log.error(queryVotesError);
    return [];
  }

  const votes_on_pending = votes.filter((vote) => {
    const app = applications_map[vote.appId];
    if (app == null) return false;
    return applicationIsOpen(app) && app.expiresAt > last_block_number;
  });
  return votes_on_pending;
}

/**
 * Retrieves votes for cadre members
 *
 * @returns An array of votes by cadre key
 */
export async function getCadreVotes(): Promise<VoteByKey[]> {
  const [queryVotesError, votes] = await tryAsync(queryTotalVotesPerCadre());
  if (queryVotesError !== undefined) {
    log.error(queryVotesError);
    return [];
  }

  return votes;
}

/**
 * Calculates the threshold needed for cadre voting decisions
 *
 * @returns The threshold value for cadre voting
 */
export async function getCadreThreshold() {
  const [countKeysError, keys] = await tryAsync(countCadreKeys());
  if (countKeysError !== undefined) {
    log.error(countKeysError);
    return 1; // Default to 1 if there's an error
  }

  return Math.floor(keys / 2) + 1;
}

/**
 * Retrieves penalty factors for cadre members
 *
 * @param cadreThreshold - The threshold value for cadre voting
 * @returns The penalty factors
 */
export async function getPenaltyFactors(cadreThreshold: number) {
  const [pendingPenalizationsError, penalizations] = await tryAsync(
    pendingPenalizations(cadreThreshold, Math.max(cadreThreshold - 1, 1)),
  );
  if (pendingPenalizationsError !== undefined) {
    log.error(pendingPenalizationsError);
    return [];
  }

  return penalizations;
}

/**
 * Processes votes for cadre members based on voting thresholds
 *
 * @param votes - The votes to process
 * @param vote_threshold - The threshold required for vote actions
 */
export async function processCadreVotes(
  votes: VoteByKey[],
  vote_threshold: number,
) {
  const processVotesPromises = votes.map(async (vote_info) => {
    const {
      appId: applicatorKey,
      acceptVotes,
      refuseVotes,
      removeVotes,
    } = vote_info;

    if (acceptVotes >= vote_threshold) {
      log.info(`Adding cadre member: ${applicatorKey}`);
      const [getCadreDiscordError, cadreDiscord] = await tryAsync(
        getCadreDiscord(applicatorKey),
      );
      if (getCadreDiscordError !== undefined) {
        log.error(getCadreDiscordError);
        return;
      }

      if (cadreDiscord == null) {
        log.error(
          `No discord account found for cadre member: ${applicatorKey}`,
        );
        return;
      }

      const [addCadreMemberError, _] = await tryAsync(
        addCadreMember(applicatorKey, cadreDiscord),
      );
      if (addCadreMemberError !== undefined) {
        log.error(addCadreMemberError);
      }
    } else if (refuseVotes >= vote_threshold) {
      log.info(`Refusing cadre application: ${applicatorKey}`);
      const [refuseCadreApplicationError, _] = await tryAsync(
        refuseCadreApplication(applicatorKey),
      );
      if (refuseCadreApplicationError !== undefined) {
        log.error(refuseCadreApplicationError);
      }
    } else if (removeVotes >= vote_threshold) {
      log.info(`Removing cadre member: ${applicatorKey}`);
      const [removeCadreMemberError, _] = await tryAsync(
        removeCadreMember(applicatorKey),
      );
      if (removeCadreMemberError !== undefined) {
        log.error(removeCadreMemberError);
      }
    }
  });

  const [processAllVotesError, _] = await tryAsync(
    Promise.all(processVotesPromises),
  );
  if (processAllVotesError !== undefined) {
    log.error(`Failed to process votes: ${processAllVotesError}`);
  }
}
