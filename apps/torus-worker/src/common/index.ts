import type { ApiPromise } from "@polkadot/api";

import type {
  DaoApplications,
  DaoApplicationStatus,
  LastBlock,
} from "@torus-ts/subspace";
import {
  pushToWhitelist,
  queryAgentApplications,
  queryLastBlock,
  refuseDaoApplication,
  removeFromWhitelist,
} from "@torus-ts/subspace";

import type { VotesByProposal } from "../db";
import { computeTotalVotesPerDao, countCadreKeys } from "../db";

export interface WorkerProps {
  lastBlockNumber: number;
  lastBlock: LastBlock;
  api: ApiPromise;
}

// -- Constants -- //

export const CONSENSUS_NETUID = 2;

export const BLOCK_TIME = 8000;
export const DAO_EXPIRATION_TIME = 75600; // 7 days in blocks

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

export async function getApplications(
  api: ApiPromise,
  applicationTypes: DaoApplicationStatus[],
) {
  const dao_entries = await queryAgentApplications(api);
  const pending_daos = dao_entries.filter((app) =>
    applicationTypes.includes(app.status),
  );
  const dao_hash_map: Record<number, DaoApplications> = pending_daos.reduce(
    (hashmap, dao) => {
      hashmap[dao.id] = dao;
      return hashmap;
    },
    {} as Record<number, DaoApplications>,
  );
  return dao_hash_map;
}

export async function getVotesOnPending(
  dao_hash_map: Record<number, DaoApplications>,
  last_block_number: number,
): Promise<VotesByProposal[]> {
  const votes = await computeTotalVotesPerDao();
  const votes_on_pending = votes.filter(
    (vote) =>
      dao_hash_map[vote.appId] &&
      (dao_hash_map[vote.appId]?.status == "Pending" ||
        dao_hash_map[vote.appId]?.status == "Accepted") &&
      (dao_hash_map[vote.appId]?.blockNumber ?? last_block_number) +
        DAO_EXPIRATION_TIME <=
        last_block_number,
  );
  return votes_on_pending;
}

export async function getCadreThreshold() {
  const keys = await countCadreKeys();
  return Math.floor(keys / 2) + 1;
}

export async function processVotesOnProposal(
  vote_info: VotesByProposal,
  vote_threshold: number,
  dao_hash_map: Record<number, DaoApplications>,
  api: ApiPromise,
) {
  const mnemonic = process.env.TORUS_CURATOR_MNEMONIC;
  const { appId: agentId, acceptVotes, refuseVotes, removeVotes } = vote_info;
  console.log(`Accept: ${acceptVotes} ${agentId} Threshold: ${vote_threshold}`);
  console.log(`Refuse: ${refuseVotes} ${agentId} Threshold: ${vote_threshold}`);
  console.log(`Remove: ${removeVotes} ${agentId} Threshold: ${vote_threshold}`);
  if (acceptVotes >= vote_threshold) {
    // sanity check
    if (agentId in dao_hash_map) {
      log(`Accepting proposal ${agentId}`);
      await pushToWhitelist(
        api,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        dao_hash_map[agentId]!.userId,
        mnemonic,
      );
    }
  } else if (refuseVotes >= vote_threshold) {
    log(`Refusing proposal ${agentId}`);
    await refuseDaoApplication(api, agentId, mnemonic);

    // refuse
  } else if (
    removeVotes >= vote_threshold &&
    dao_hash_map[agentId] !== undefined &&
    dao_hash_map[agentId].status === "Accepted"
  ) {
    log(`Removing proposal ${agentId}`);
    await removeFromWhitelist(api, dao_hash_map[agentId].userId, mnemonic);
  }
}

export async function processAllVotes(
  votes_on_pending: VotesByProposal[],
  vote_threshold: number,
  dao_hash_map: Record<number, DaoApplications>,
  api: ApiPromise,
) {
  await Promise.all(
    votes_on_pending.map((vote_info) =>
      processVotesOnProposal(
        vote_info,
        vote_threshold,
        dao_hash_map,
        api,
      ).catch((error) =>
        console.log(`Failed to process vote for reason: ${error}`),
      ),
    ),
  );
}
