import type { ApiPromise } from "@polkadot/api";

import type { AgentApplication, LastBlock } from "@torus-ts/subspace";
import { queryAgentApplications, queryLastBlock } from "@torus-ts/subspace";

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
