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
import { tryAsyncLoggingRaw } from "@torus-ts/utils/error-handler/server-operations";
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

export interface WorkerProps {
  lastBlockNumber: number;
  lastBlock: LastBlock;
  api: ApiPromise;
}

// -- Constants -- //

export const APPLICATION_EXPIRATION_TIME =
  CONSTANTS.TIME.BLOCK_TIME_SECONDS * CONSTANTS.TIME.ONE_WEEK; // 7 days in blocks

// -- Functions -- //

export function log(...args: unknown[]) {
  const [first, ...rest] = args;
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  console.log(`[${new Date().toISOString()}] ${first}`, ...rest);
}

export function isNewBlock(savedBlock: number, queriedBlock: number) {
  if (savedBlock === queriedBlock) {
    log(`Block ${queriedBlock} already processed, skipping`);
    return false;
  }
  return true;
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sleepUntilNewBlock(props: WorkerProps) {
  while (true) {
    const [error, lastBlock] = await tryAsyncLoggingRaw(
      queryLastBlock(props.api),
    );

    if (error) {
      log(
        `Error querying last block: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
      );
      await sleep(CONSTANTS.TIME.BLOCK_TIME_MILLISECONDS);
      continue;
    }
    if (!lastBlock) {
      log("Failed to get a new block");
      await sleep(CONSTANTS.TIME.BLOCK_TIME_MILLISECONDS);
      continue;
    }

    if (!isNewBlock(props.lastBlock.blockNumber, lastBlock.blockNumber)) {
      await sleep(CONSTANTS.TIME.BLOCK_TIME_MILLISECONDS);
    } else {
      return lastBlock;
    }
  }
}

// -- DAO Applications -- //

type ApplicationVoteStatus = "open" | "accepted" | "locked";

// TODO: cursed function. Should refactor everywhere to just use Application
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

/*
  We need this for now because before we used to have the enum 
  // as all upper case on the db. We changed it, because it didnt match the
  // values that came from the network and we want parity of this sort of thing
  the maximum that we can
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

export function getProposalStatus(proposal: Proposal) {
  const status = match(proposal.status)({
    Open: () => applicationStatusValues.Open,
    Accepted: () => applicationStatusValues.Accepted,
    Expired: () => applicationStatusValues.Expired,
    Refused: () => applicationStatusValues.Rejected,
  });
  return status;
}

export const getApplicationVoteStatus = (
  app: AgentApplication,
): ApplicationVoteStatus =>
  match(app.status)({
    Open: () => "open",
    Resolved: ({ accepted }) => (accepted ? "accepted" : "locked"),
    Expired: () => "locked",
  });

export const applicationIsPending = (app: AgentApplication) =>
  getApplicationVoteStatus(app) != "locked";

export const applicationIsOpen = (app: AgentApplication) =>
  match(app.status)({
    Open: () => true,
    Resolved: ({ accepted }) => accepted,
    Expired: () => false,
  });

// TODO: refactor to return using the db type
export async function getApplications(
  api: Api,
  filterFn: (app: AgentApplication) => boolean,
) {
  const [error, application_entries] = await tryAsyncLoggingRaw(
    queryAgentApplications(api),
  );

  if (error) {
    log(
      `Error querying agent applications: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
    );
    return;
  }
  if (!application_entries) {
    log("No application entries found");
    return;
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

export async function getProposals(
  api: Api,
  filterFn: (app: Proposal) => boolean,
) {
  const [error, proposals_entries] = await tryAsyncLoggingRaw(
    queryProposals(api),
  );

  if (error) {
    log(
      `Error querying proposals: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
    );
    return;
  }

  if (!proposals_entries) {
    log("No proposals found");
    return;
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

export async function getProposalsDB(filterFn: (app: NewProposal) => boolean) {
  const [error, proposals] = await tryAsyncLoggingRaw(queryProposalsDB());

  if (error) {
    log(
      `Error querying proposals from DB: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
    );
    return;
  }
  if (!proposals) {
    log("No proposals found");
    return;
  }

  const pending_daos = proposals.filter(filterFn);
  return pending_daos;
}

export async function getApplicationsDB(
  filterFn: (app: ApplicationDB) => boolean,
) {
  const [error, applications] = await tryAsyncLoggingRaw(
    queryAgentApplicationsDB(),
  );

  if (error) {
    log(
      `Error querying agent applications from DB: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
    );
    return;
  }

  if (!applications) {
    log("No applications found");
    return;
  }

  const pending_daos = applications.filter(filterFn);
  return pending_daos;
}

export async function getCadreCandidates(
  filterFn: (app: CadreCandidate) => boolean,
) {
  const [error, cadreCandidates] = await tryAsyncLoggingRaw(
    queryCadreCandidates(),
  );

  if (error) {
    log(
      `Error querying cadre candidates: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
    );
    return [];
  }

  if (!cadreCandidates) {
    log("No cadre candidates found");
    return [];
  }

  return cadreCandidates.filter(filterFn);
}

export async function getVotesOnPending(
  applications_map: Record<number, AgentApplication>,
  last_block_number: number,
): Promise<VoteById[]> {
  const [error, votes] = await tryAsyncLoggingRaw(queryTotalVotesPerApp());

  if (error) {
    log(
      `Error querying total votes per app: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
    );
    return [];
  }

  if (!votes) {
    log("No votes found");
    return [];
  }

  const votes_on_pending = votes.filter((vote) => {
    const app = applications_map[vote.appId];
    if (app == null) return false;
    return applicationIsOpen(app) && app.expiresAt > last_block_number;
  });
  return votes_on_pending;
}

export async function getCadreVotes(): Promise<VoteByKey[]> {
  const [error, votes] = await tryAsyncLoggingRaw(queryTotalVotesPerCadre());

  if (error) {
    log(
      `Error querying total votes per cadre: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
    );
    return [];
  }
  if (!votes) {
    log("No votes found");
    return [];
  }

  return votes;
}

export async function getCadreThreshold() {
  const [error, keys] = await tryAsyncLoggingRaw(countCadreKeys());

  if (error) {
    log(
      `Error counting cadre keys: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
    );
    return;
  }
  if (!keys) {
    log("No cadre keys found");
    return;
  }

  return Math.floor(keys / 2) + 1;
}

export async function getPenaltyFactors(cadreThreshold: number) {
  const [error, penalizations] = await tryAsyncLoggingRaw(
    pendingPenalizations(cadreThreshold, Math.max(cadreThreshold - 1, 1)),
  );

  if (error) {
    log(
      `Error getting pending penalizations: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
    );
    return [];
  }

  return penalizations;
}

// TODO: abstract common logic and merge with processVotesOnProposal
export async function processCadreVotes(
  votes: VoteByKey[],
  vote_threshold: number,
) {
  await Promise.all(
    votes.map(async (vote_info) => {
      const {
        appId: applicatorKey,
        acceptVotes,
        refuseVotes,
        removeVotes,
      } = vote_info;

      if (acceptVotes >= vote_threshold) {
        console.log("Adding cadre member:", applicatorKey);

        const [discordError, cadreDiscord] = await tryAsyncLoggingRaw(
          getCadreDiscord(applicatorKey),
        );

        if (discordError) {
          log(
            `Error getting cadre discord for ${applicatorKey}: ${discordError instanceof Error ? discordError.message : JSON.stringify(discordError)}`,
          );
          return;
        }

        if (cadreDiscord == null) {
          log(`No discord account found for cadre member: ${applicatorKey}`);
          return;
        }

        const [addError] = await tryAsyncLoggingRaw(
          addCadreMember(applicatorKey, cadreDiscord),
        );
        if (addError) {
          log(
            `Error adding cadre member ${applicatorKey}: ${addError instanceof Error ? addError.message : JSON.stringify(addError)}`,
          );
        }
      } else if (refuseVotes >= vote_threshold) {
        console.log("Refusing cadre application:", applicatorKey);

        const [refuseError] = await tryAsyncLoggingRaw(
          refuseCadreApplication(applicatorKey),
        );
        if (refuseError) {
          log(
            `Error refusing cadre application ${applicatorKey}: ${refuseError instanceof Error ? refuseError.message : JSON.stringify(refuseError)}`,
          );
        }
      } else if (removeVotes >= vote_threshold) {
        console.log("Removing cadre member:", applicatorKey);

        const [removeError] = await tryAsyncLoggingRaw(
          removeCadreMember(applicatorKey),
        );
        if (removeError) {
          log(
            `Error removing cadre member ${applicatorKey}: ${removeError instanceof Error ? removeError.message : JSON.stringify(removeError)}`,
          );
        }
      }
    }),
  ).catch((error) =>
    log(
      `Failed to process vote for reason: ${error instanceof Error ? error.message : JSON.stringify(error)}`,
    ),
  );
}
