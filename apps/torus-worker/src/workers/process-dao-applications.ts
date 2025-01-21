import type { ApiPromise } from "@polkadot/api";
import { match } from "rustie";

import type { AgentApplication } from "@torus-ts/subspace";
import {
  acceptApplication,
  denyApplication,
  penalizeAgent,
  removeFromWhitelist,
} from "@torus-ts/subspace";

import type { WorkerProps } from "../common";
import {
  BLOCK_TIME,
  getApplications,
  log,
  processAllVotes,
  processCadreVotes,
  getCadreVotes,
  sleep,
  sleepUntilNewBlock,
} from "../common";
import type { VotesByApplication } from "../db";
import {
  countCadreKeys,
  pendingPenalizations,
  queryTotalVotesPerApp,
  updatePenalizeAgentVotes,
} from "../db";
import { validateEnvOrExit } from "@torus-ts/utils/env";

import { z } from "zod";

const getEnv = validateEnvOrExit({
  TORUS_CURATOR_MNEMONIC: z
    .string()
    .nonempty("TORUS_CURATOR_MNEMONIC is required"),
});

export async function processApplicationsWorker(props: WorkerProps) {
  const env = getEnv(process.env);
  const mnemonic = env.TORUS_CURATOR_MNEMONIC;

  while (true) {
    try {
      const lastBlock = await sleepUntilNewBlock(props);
      props.lastBlock = lastBlock;
      log(`Block ${props.lastBlock.blockNumber}: processing`);

      const apps_map = await getApplications(props.api, (app) =>
        match(app.status)({
          Open: () => true,
          Resolved: ({ accepted }) => accepted,
          Expired: () => false,
        }),
      );

      const votes_on_pending = await getVotesOnPending(
        apps_map,
        lastBlock.blockNumber,
      );

      const vote_threshold = await getCadreThreshold();

      await processAllVotes(
        props.api,
        mnemonic,
        votes_on_pending,
        vote_threshold,
        apps_map,
      );
      const cadreVotes = await getCadreVotes();
      await processCadreVotes(
        cadreVotes,
        vote_threshold,
      )
      console.log("threshold: ", vote_threshold);
      const factors = await getPenaltyFactors(vote_threshold);
      await processPenalty(props.api, mnemonic, factors);
    } catch (e) {
      log("UNEXPECTED ERROR: ", e);
      await sleep(BLOCK_TIME);
    }
  }
}

export async function processAllVotes(
  api: ApiPromise,
  mnemonic: string,
  votes_on_pending: VotesByApplication[],
  vote_threshold: number,
  application_map: Record<number, AgentApplication>,
) {
  await Promise.all(
    votes_on_pending.map((vote_info) =>
      processVotesOnProposal(
        api,
        mnemonic,
        vote_info,
        vote_threshold,
        application_map,
      ).catch((error) =>
        console.log(`Failed to process vote for reason: ${error}`),
      ),
    ),
  );
}

export async function processVotesOnProposal(
  api: ApiPromise,
  mnemonic: string,
  vote_info: VotesByApplication,
  vote_threshold: number,
  applications_map: Record<number, AgentApplication>,
) {
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

const applicationIsOpen = (app: AgentApplication) =>
  match(app.status)({
    Open: () => true,
    Resolved: ({ accepted }) => accepted,
    Expired: () => false,
  });

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

export async function getPenaltyFactors(cadreThreshold: number) {
  const penalizations = await pendingPenalizations(cadreThreshold);
  return penalizations;
}

export async function processPenalty(
  api: ApiPromise,
  mnemonic: string,
  penaltiesToApply: {
    agentKey: string;
    medianPenaltyFactor: number;
  }[],
) {
  console.log("Penalties to apply: ", penaltiesToApply);
  for (const penalty of penaltiesToApply) {
    const { agentKey, medianPenaltyFactor } = penalty;
    await penalizeAgent(api, agentKey, medianPenaltyFactor, mnemonic);
  }
  const penalizedKeys = penaltiesToApply.map((item) => item.agentKey);
  await updatePenalizeAgentVotes(penalizedKeys);
  console.log("Penalties applied");
}
