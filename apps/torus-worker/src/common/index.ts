import type { ApiPromise } from "@polkadot/api";
import { match } from "rustie";

import type { AgentApplication, LastBlock } from "@torus-ts/subspace";
import {
  queryAgentApplications,
  queryLastBlock,
  denyApplication,
  acceptApplication,
  removeFromWhitelist,
} from "@torus-ts/subspace";

import type { VotesByApplication } from "../db";
import {
  queryTotalVotesPerApp as queryTotalVotesPerApp,
  countCadreKeys,
} from "../db";

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

const applicationIsOpen = (app: AgentApplication) =>
  match(app.status)({
    Open: () => true,
    Resolved: ({ accepted }) => accepted,
    Expired: () => false,
  });

export async function getApplications(
  api: ApiPromise,
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

export async function getVotesOnPending(
  applications_map: Record<number, AgentApplication>,
  last_block_number: number,
): Promise<VotesByApplication[]> {
  const votes = await queryTotalVotesPerApp();
  const votes_on_pending = votes.filter((vote) => {
    const app = applications_map[vote.appId];
    if (app == null) return false;
    return applicationIsOpen(app) && app.expiresAt > last_block_number;
  });
  return votes_on_pending;
}

export async function getCadreThreshold() {
  const keys = await countCadreKeys();
  return Math.floor(keys / 2) + 1;
}

export async function processVotesOnProposal(
  vote_info: VotesByApplication,
  vote_threshold: number,
  applications_map: Record<number, AgentApplication>,
  api: ApiPromise,
) {
  const mnemonic = process.env.TORUS_CURATOR_MNEMONIC;
  const { appId: agentId, acceptVotes, refuseVotes, removeVotes } = vote_info;
  log(`Accept: ${acceptVotes} ${agentId} Threshold: ${vote_threshold}`);
  log(`Refuse: ${refuseVotes} ${agentId} Threshold: ${vote_threshold}`);
  log(`Remove: ${removeVotes} ${agentId} Threshold: ${vote_threshold}`);

  const app = applications_map[agentId];
  if (app == null) throw new Error("application not found");

  if (acceptVotes >= vote_threshold) {
    log(`Accepting proposal ${agentId}`);
    // await pushToWhitelist(api, app.payerKey, mnemonic);
    await acceptApplication(api, agentId, mnemonic);
  } else if (refuseVotes >= vote_threshold) {
    log(`Refusing proposal ${agentId}`);
    await denyApplication(api, agentId, mnemonic);
  } else if (
    removeVotes >= vote_threshold &&
    applications_map[agentId] !== undefined
  ) {
    const status = applications_map[agentId].status;
    const isResolved = match(status)({
      Open: () => false,
      Resolved: ({ accepted }) => accepted,
      Expired: () => false,
    });
    if (isResolved) {
      log(`Removing proposal ${agentId}`);
      await removeFromWhitelist(
        api,
        applications_map[agentId].agentKey,
        mnemonic,
      );
    }
  }
}

export async function processAllVotes(
  votes_on_pending: VotesByApplication[],
  vote_threshold: number,
  application_map: Record<number, AgentApplication>,
  api: ApiPromise,
) {
  await Promise.all(
    votes_on_pending.map((vote_info) =>
      processVotesOnProposal(
        vote_info,
        vote_threshold,
        application_map,
        api,
      ).catch((error) =>
        console.log(`Failed to process vote for reason: ${error}`),
      ),
    ),
  );
}
