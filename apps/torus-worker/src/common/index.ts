import type { ApiPromise } from "@polkadot/api";
import { match } from "rustie";

import type {
  AgentApplication,
  Api,
  LastBlock,
  Proposal,
} from "@torus-network/sdk/chain";
import {
  queryAgentApplications,
  queryLastBlock,
  queryProposals,
} from "@torus-network/sdk/chain";
import { CONSTANTS } from "@torus-network/sdk/constants";
import { BasicLogger } from "@torus-network/torus-utils/logger";
import { tryAsync } from "@torus-network/torus-utils/try-catch";

import { applicationStatusValues } from "@torus-ts/db/schema";

import type {
  ApplicationDB,
  CadreCandidate,
  NewApplication,
  NewProposal,
  VotesByKey as VoteByKey,
} from "../db";
import {
  addCadreMember,
  getCadreDiscord,
  queryAgentApplicationsDB,
  queryCadreCandidates,
  queryProposalsDB,
  queryTotalVotesPerCadre,
  refuseCadreApplication,
  removeCadreMember,
} from "../db";
import type { DiscordRoleManager } from "./discord-role";

/**
 * @deprecated
 */
export interface WorkerProps {
  lastBlockNumber: number;
  lastBlock: LastBlock;
  api: ApiPromise;
}

const log = BasicLogger.create({ name: "common-indexer" });

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
 * Blocks execution until a new blockchain block is detected.
 * Polls the chain at regular intervals, avoiding redundant processing
 * of already-seen blocks.
 *
 * @param props - Contains API connection and tracking state for last processed block
 * @returns The new block data once detected
 */
export async function sleepUntilNewBlock(props: WorkerProps) {
  while (true) {
    const queryLastBlockRes = await tryAsync(queryLastBlock(props.api));
    if (log.ifResultIsErr(queryLastBlockRes)) {
      await sleep(CONSTANTS.TIME.BLOCK_TIME_MILLISECONDS);
      continue;
    }
    const [_queryLastBlockErr, currentBlock] = queryLastBlockRes;

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
 * Transforms on-chain agent application data to our database schema.
 * Maps blockchain-specific status values to our normalized application states.
 *
 * @param agentApplication - Raw application data from the blockchain
 * @returns Database-ready application object with normalized fields
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
 * Transforms on-chain proposal data to our database schema.
 * Handles status mapping between blockchain and database representations.
 *
 * @param proposal - Raw proposal data from the blockchain
 * @returns Database-ready proposal object with normalized fields
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
 * Normalizes application status values for consistent cross-system representation.
 * Handles case differences and ensures valid enum values for database operations.
 *
 * @param value - Raw status string from any source
 * @returns Normalized status value that conforms to our enum type
 * @throws Error if the status value is invalid
 */
//We need this for now because before we used to have the enum
// as all upper case on the db. We changed it, because it didnt match the
// values that came from the network and we want parity of this sort of thing
//the maximum that we can
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
 * Extracts the normalized status from a proposal object.
 * Uses pattern matching to handle different proposal states.
 *
 * @param proposal - Proposal object from the blockchain
 * @returns Normalized status value for database representation
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
 * Determines the current voting eligibility state of an application.
 * Maps complex blockchain status to simplified voting states:
 * - "open": Voting allowed
 * - "accepted": Already accepted but removable
 * - "locked": Voting no longer possible (resolved/expired)
 *
 * @param app - Agent application to evaluate
 * @returns Simplified vote status for voting logic
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
 * Checks if an application is still eligible for voting operations.
 * Applications that are resolved and rejected or expired are considered locked.
 *
 * @param app - Agent application to evaluate
 * @returns Whether the application can still receive votes
 */
export const applicationIsPending = (app: AgentApplication) =>
  getApplicationVoteStatus(app) != "locked";


/**
 * Retrieves and filters applications from the blockchain.
 * Transforms the array response into a map indexed by application ID for
 * more efficient lookups during processing.
 *
 * @param api - Blockchain API instance
 * @param filterFn - Predicate function to select applications of interest
 * @returns Map of application IDs to their corresponding application objects
 */
export async function getApplications(
  api: Api,
  filterFn: (app: AgentApplication) => boolean,
) {
  const queryApplicationsRes = await tryAsync(queryAgentApplications(api));
  if (log.ifResultIsErr(queryApplicationsRes)) return {};
  const [_queryApplicationsErr, application_entries] = queryApplicationsRes;

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
 * Retrieves and filters governance proposals from the blockchain.
 * Transforms the array response into a map indexed by proposal ID for
 * more efficient lookups during processing.
 *
 * @param api - Blockchain API instance
 * @param filterFn - Predicate function to select proposals of interest
 * @returns Map of proposal IDs to their corresponding proposal objects
 */
export async function getProposals(
  api: Api,
  filterFn: (app: Proposal) => boolean,
) {
  const queryProposalsRes = await tryAsync(queryProposals(api));
  if (log.ifResultIsErr(queryProposalsRes)) return {};
  const [_queryProposalsErr, proposals_entries] = queryProposalsRes;

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
  const queryProposalsDBRes = await tryAsync(queryProposalsDB());
  if (log.ifResultIsErr(queryProposalsDBRes)) return [];
  const [_queryProposalsDBErr, proposals] = queryProposalsDBRes;

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
  const queryApplicationsDBRes = await tryAsync(queryAgentApplicationsDB());
  if (log.ifResultIsErr(queryApplicationsDBRes)) return [];
  const [_queryApplicationsDBErr, applications] = queryApplicationsDBRes;

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
  const queryCadreCandidatesRes = await tryAsync(queryCadreCandidates());
  if (log.ifResultIsErr(queryCadreCandidatesRes)) return [];
  const [_queryCadreCandidatesErr, cadreCandidates] = queryCadreCandidatesRes;

  return cadreCandidates.filter(filterFn);
}

export async function getCadreVotes(): Promise<VoteByKey[]> {
  const queryVotesRes = await tryAsync(queryTotalVotesPerCadre());
  if (log.ifResultIsErr(queryVotesRes)) return [];
  const [_queryVotesErr, votes] = queryVotesRes;

  return votes;
}

/**
 * Processes voting results for cadre member candidates.
 * Handles three distinct actions based on vote counts:
 * 1. Adding approved candidates to the cadre
 * 2. Refusing pending applications that reach rejection threshold
 * 3. Removing existing members when removal votes reach threshold
 *
 * Error handling is performed per-candidate to ensure one failure
 * doesn't block the entire batch.
 *
 * @param votes - Aggregated vote counts for each candidate
 * @param voteThreshold - Minimum votes required for action
 * @param discordDaoRoleManager - The Discord role manager instance
 */
export async function processCadreVotes(
  votes: VoteByKey[],
  voteThreshold: number,
  discordDaoRoleManager: DiscordRoleManager | null,
) {
  const processVotesPromises = votes.map(async (vote_info) => {
    const {
      appId: applicatorKey,
      acceptVotes,
      refuseVotes,
      removeVotes,
    } = vote_info;

    const getCadreDiscordRes = await tryAsync(getCadreDiscord(applicatorKey));
    if (log.ifResultIsErr(getCadreDiscordRes)) return;
    const [_getCadreDiscordErr, cadreDiscord] = getCadreDiscordRes;

    if (acceptVotes >= voteThreshold) {
      log.info(`Adding cadre member: ${applicatorKey}`);

      if (cadreDiscord == null) {
        log.error(
          `No discord account found for cadre member: ${applicatorKey}`,
        );
        return;
      }

      const addCadreMemberRes = await tryAsync(
        addCadreMember(applicatorKey, cadreDiscord),
      );
      if (log.ifResultIsErr(addCadreMemberRes)) {
        return;
      }

      if (discordDaoRoleManager == null) {
        log.warn(
          `Role assignment will be skipped for cadre member ${applicatorKey} because Discord role manager is not configured.`,
        );
      } else {
        const assignRoleRes =
          await discordDaoRoleManager.assignRole(cadreDiscord);
        log.ifResultIsErr(assignRoleRes);
      }
    } else if (refuseVotes >= voteThreshold) {
      log.info(`Refusing cadre application: ${applicatorKey}`);
      const refuseCadreApplicationRes = await tryAsync(
        refuseCadreApplication(applicatorKey),
      );
      log.ifResultIsErr(refuseCadreApplicationRes);
    } else if (removeVotes >= voteThreshold) {
      log.info(`Removing cadre member: ${applicatorKey}`);

      const removeCadreMemberRes = await tryAsync(
        removeCadreMember(applicatorKey),
      );
      if (log.ifResultIsErr(removeCadreMemberRes)) {
        return;
      }

      if (cadreDiscord == null) {
        log.error(
          `No discord account found for cadre member: ${applicatorKey}`,
        );
        return;
      }

      if (discordDaoRoleManager == null) {
        log.warn(
          `Role removal will be skipped for cadre member ${applicatorKey} because Discord role manager is not configured.`,
        );
      } else {
        const removeRoleRes =
          await discordDaoRoleManager.removeRole(cadreDiscord);
        log.ifResultIsErr(removeRoleRes);
      }
    }
  });

  const processAllVotesRes = await tryAsync(Promise.all(processVotesPromises));
  if (log.ifResultIsErr(processAllVotesRes)) {
    log.info("Failed to process votes"); // Already logged detailed error by ifResultIsErr
  }
}
