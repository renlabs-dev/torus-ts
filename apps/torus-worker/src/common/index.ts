import type {
  VotesByNumericId as VoteById,
  VotesByKey as VoteByKey,
  NewApplication,
  NewProposal,
  ApplicationDB,
  CadreCandidate,
} from "../db";
import {
  queryTotalVotesPerApp,
  countCadreKeys,
  pendingPenalizations,
  addCadreMember,
  queryTotalVotesPerCadre,
  removeCadreMember,
  getCadreDiscord,
  refuseCadreApplication,
  queryAgentApplicationsDB,
  queryCadreCandidates,
  queryProposalsDB,
} from "../db";
import type { ApiPromise } from "@polkadot/api";
import { applicationStatusValues } from "@torus-ts/db/schema";
import type {
  AgentApplication,
  Api,
  LastBlock,
  Proposal,
} from "@torus-ts/subspace";
import {
  queryAgentApplications,
  queryLastBlock,
  queryProposals,
} from "@torus-ts/subspace";
import { match } from "rustie";

export interface WorkerProps {
  lastBlockNumber: number;
  lastBlock: LastBlock;
  api: ApiPromise;
}

// -- Constants -- //

export const BLOCK_TIME = 8000;
export const APPLICATION_EXPIRATION_TIME = 75600; // 7 days in blocks

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
    try {
      const lastBlock = await queryLastBlock(props.api);
      if (!isNewBlock(props.lastBlock.blockNumber, lastBlock.blockNumber)) {
        await sleep(BLOCK_TIME);
      } else {
        return lastBlock;
      }
    } catch (e) {
      log("UNEXPECTED ERROR: ", e);
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
    Open: () => applicationStatusValues.OPEN,
    Resolved: ({ accepted }) =>
      accepted
        ? applicationStatusValues.ACCEPTED
        : applicationStatusValues.REJECTED,
    Expired: () => applicationStatusValues.REJECTED,
  });

  return {
    ...agentApplication,
    cost: agentApplication.cost.toString(),
    status: mappedStatus,
  };
}

export function agentProposalToProposal(proposal: Proposal): NewProposal {
  const status = match(proposal.status)({
    Open: () => applicationStatusValues.OPEN,
    Accepted: () => applicationStatusValues.ACCEPTED,
    Expired: () => applicationStatusValues.EXPIRED,
    Refused: () => applicationStatusValues.REJECTED,
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
  const application_entries = await queryAgentApplications(api);
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
  const application_entries = await queryProposals(api);
  const pending_daos = application_entries.filter(filterFn);
  const applications_map: Record<number, Proposal> = pending_daos.reduce(
    (hashmap, proposal) => {
      hashmap[proposal.id] = proposal;
      return hashmap;
    },
    {} as Record<number, Proposal>,
  );
  return applications_map;
}

export async function getProposalsDB(filterFn: (app: NewProposal) => boolean) {
  const proposals = await queryProposalsDB();
  const pending_daos = proposals.filter(filterFn);
  return pending_daos;
}

export async function getApplicationsDB(
  filterFn: (app: ApplicationDB) => boolean,
) {
  const applications = await queryAgentApplicationsDB();
  const pending_daos = applications.filter(filterFn);
  return pending_daos;
}

export async function getCadreCandidates(
  filterFn: (app: CadreCandidate) => boolean,
) {
  const cadreCandidates = await queryCadreCandidates();
  return cadreCandidates.filter(filterFn);
}

export async function getVotesOnPending(
  applications_map: Record<number, AgentApplication>,
  last_block_number: number,
): Promise<VoteById[]> {
  const votes = await queryTotalVotesPerApp();
  const votes_on_pending = votes.filter((vote) => {
    const app = applications_map[vote.appId];
    if (app == null) return false;
    return applicationIsOpen(app) && app.expiresAt > last_block_number;
  });
  return votes_on_pending;
}

export async function getCadreVotes(): Promise<VoteByKey[]> {
  const votes = await queryTotalVotesPerCadre();
  return votes;
}

export async function getCadreThreshold() {
  const keys = await countCadreKeys();
  return Math.floor(keys / 2) + 1;
}

export async function getPenaltyFactors(cadreThreshold: number) {
  const penalizations = await pendingPenalizations(
    cadreThreshold,
    Math.max(cadreThreshold - 1, 1),
  );
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
        const cadreDiscord = await getCadreDiscord(applicatorKey);
        if (cadreDiscord == null) {
          throw new Error(
            "No discord account found for cadre member: " + applicatorKey,
          );
        }
        await addCadreMember(applicatorKey, cadreDiscord);
      } else if (refuseVotes >= vote_threshold) {
        console.log("Refusing cadre application:", applicatorKey);
        await refuseCadreApplication(applicatorKey);
      } else if (removeVotes >= vote_threshold) {
        console.log("Removing cadre member:", applicatorKey);
        await removeCadreMember(applicatorKey);
      }
    }),
  ).catch((error) =>
    console.log(`Failed to process vote for reason: ${error}`),
  );
}
