import { match } from "rustie";
import { z } from "zod";

import type { AgentApplication } from "@torus-ts/subspace";
import {
  acceptApplication,
  denyApplication,
  penalizeAgent,
  removeFromWhitelist,
} from "@torus-ts/subspace";
import { validateEnvOrExit } from "@torus-ts/utils/env";

import type { WorkerProps } from "../common";
import {
  BLOCK_TIME,
  getApplications,
  getCadreThreshold,
  getVotesOnPending,
  log,
  processAllVotes,
  processCadreVotes,
  getCadreVotes,
  sleep,
  getPenaltyFactors,
  sleepUntilNewBlock,
  processPenalty,
} from "../common";
import type { VotesByApplication } from "../db";
import {
  countCadreKeys,
  pendingPenalizations,
  queryTotalVotesPerApp,
  updatePenalizeAgentVotes,
} from "../db";

const getEnv = validateEnvOrExit({
  TORUS_CURATOR_MNEMONIC: z
    .string()
    .nonempty("TORUS_CURATOR_MNEMONIC is required"),
});

type ApplicationVoteStatus = "open" | "accepted" | "locked";

const getApplicationVoteStatus = (
  app: AgentApplication,
): ApplicationVoteStatus =>
  match(app.status)({
    Open: () => "open",
    Resolved: ({ accepted }) => (accepted ? "accepted" : "locked"),
    Expired: () => "locked",
  });

const applicationIsPending = (app: AgentApplication) =>
  getApplicationVoteStatus(app) != "locked";

export async function processApplicationsWorker(props: WorkerProps) {
  while (true) {
    try {
      const lastBlock = await sleepUntilNewBlock(props);
      props.lastBlock = lastBlock;
      log(`Block ${props.lastBlock.blockNumber}: processing`);

      const apps_map = await getApplications(props.api, applicationIsPending);

      const votes_on_pending = await getVotesOnPending(
        apps_map,
        lastBlock.blockNumber,
      );

      const vote_threshold = await getCadreThreshold();

      await processAllVotes(
        votes_on_pending,
        vote_threshold,
        apps_map,
        props.api,
      );
      const cadreVotes = await getCadreVotes();
      await processCadreVotes(cadreVotes, vote_threshold);
      console.log("threshold: ", vote_threshold);
      const factors = await getPenaltyFactors(vote_threshold);
      await processPenalty(factors, props.api);
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
  const { appId, acceptVotes, refuseVotes, removeVotes } = vote_info;

  const app = applications_map[appId];
  if (app == null) throw new Error("Impossible: Application ID not found");

  const appVoteStatus = getApplicationVoteStatus(app);
  log(
    `Application ${appId} [${appVoteStatus}] votes[ accept:${acceptVotes}, refuse:${refuseVotes}, remove:${removeVotes} ]`,
  );

  // Application is open and we have votes to accept or refuse
  if (appVoteStatus == "open") {
    if (acceptVotes >= vote_threshold) {
      log(`Accepting proposal ${appId} ${app.agentKey}`);
      const res = await acceptApplication(api, appId, mnemonic);
      console.log("acceptApplication executed:", res.toHuman());
    } else if (refuseVotes >= vote_threshold) {
      log(`Refusing proposal ${appId}`);
      const res = await denyApplication(api, appId, mnemonic);
      console.log("denyApplication executed:", res.toHuman());
    }
  } else if (
    appVoteStatus == "accepted" &&
    removeVotes >= vote_threshold &&
    applications_map[appId] !== undefined
  ) {
    log(`Removing proposal ${appId}`);
    // Note: if chain is updated to include revoking logic, this should be
    // `revokeApplication` instead of `removeFromWhitelist`
    const res = await removeFromWhitelist(
      api,
      applications_map[appId].agentKey,
      mnemonic,
    );
    console.log("removeFromWhitelist executed:", res.toHuman());
  }
}

export async function getVotesOnPending(
  applications_map: Record<number, AgentApplication>,
  last_block_number: number,
): Promise<VotesByApplication[]> {
  const votes = await queryTotalVotesPerApp();
  const votes_on_pending = votes.filter((vote) => {
    const app = applications_map[vote.appId];
    if (app == null) return false;
    return applicationIsPending(app) && app.expiresAt > last_block_number;
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
