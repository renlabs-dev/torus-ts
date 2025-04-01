import type { ApiPromise } from "@polkadot/api";
import type { AgentApplication } from "@torus-network/sdk";
import {
  acceptApplication,
  CONSTANTS,
  denyApplication,
  penalizeAgent,
  removeFromWhitelist,
} from "@torus-network/sdk";
import { validateEnvOrExit } from "@torus-ts/utils/env";
import { tryAsyncLoggingRaw } from "@torus-ts/utils/error-handler/server-operations";
import { z } from "zod";
import type { WorkerProps } from "../common";
import {
  applicationIsPending,
  getApplications,
  getApplicationVoteStatus,
  getCadreVotes,
  log,
  processCadreVotes,
  sleep,
  sleepUntilNewBlock,
} from "../common";
import type { VotesByNumericId } from "../db";
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

export async function processApplicationsWorker(props: WorkerProps) {
  const env = getEnv(process.env);
  while (true) {
    const [error] = await tryAsyncLoggingRaw(async () => {
      const lastBlock = await sleepUntilNewBlock(props);
      props.lastBlock = lastBlock;
      log(`Block ${props.lastBlock.blockNumber}: processing`);

      const [appsError, apps_map] = await tryAsyncLoggingRaw(
        getApplications(props.api, applicationIsPending),
      );
      if (appsError) {
        log(
          `Error fetching applications: ${appsError instanceof Error ? appsError.message : JSON.stringify(appsError)}`,
        );
        return;
      }

      if (!apps_map) {
        log(`No applications found`);
        return;
      }

      const [votesError, votes_on_pending] = await tryAsyncLoggingRaw(
        getVotesOnPending(apps_map, lastBlock.blockNumber),
      );
      if (votesError) {
        log(
          `Error fetching votes: ${votesError instanceof Error ? votesError.message : JSON.stringify(votesError)}`,
        );
        return;
      }

      if (!votes_on_pending) {
        log(`No votes found`);
        return;
      }

      const [thresholdError, vote_threshold] =
        await tryAsyncLoggingRaw(getCadreThreshold());
      if (thresholdError) {
        log(
          `Error getting threshold: ${thresholdError instanceof Error ? thresholdError.message : JSON.stringify(thresholdError)}`,
        );
        return;
      }

      if (!vote_threshold) {
        log(`No vote threshold found`);
        return;
      }

      const mnemonic = env.TORUS_CURATOR_MNEMONIC;
      await processAllVotes(
        props.api,
        mnemonic,
        votes_on_pending,
        vote_threshold,
        apps_map,
      );

      const [cadreVotesError, cadreVotes] =
        await tryAsyncLoggingRaw(getCadreVotes());
      if (cadreVotesError) {
        log(
          `Error getting cadre votes: ${cadreVotesError instanceof Error ? cadreVotesError.message : JSON.stringify(cadreVotesError)}`,
        );
        return;
      }

      if (!cadreVotes) {
        log(`No cadre votes found`);
        return;
      }

      await processCadreVotes(cadreVotes, vote_threshold);
      console.log("threshold: ", vote_threshold);

      const [penaltyThresholdError, penaltyVoteThreshold] =
        await tryAsyncLoggingRaw(getPenaltyThreshold());
      if (penaltyThresholdError) {
        log(
          `Error getting penalty threshold: ${penaltyThresholdError instanceof Error ? penaltyThresholdError.message : JSON.stringify(penaltyThresholdError)}`,
        );
        return;
      }
      console.log("penalty threshold: ", penaltyVoteThreshold);

      if (!penaltyVoteThreshold) {
        log(`No penalty vote threshold found`);
        return;
      }

      const [factorsError, factors] = await tryAsyncLoggingRaw(
        getPenaltyFactors(penaltyVoteThreshold),
      );
      if (factorsError) {
        log(
          `Error getting penalty factors: ${factorsError instanceof Error ? factorsError.message : JSON.stringify(factorsError)}`,
        );
        return;
      }

      if (!factors) {
        log(`No penalty factors found`);
        return;
      }

      await processPenalty(props.api, mnemonic, factors);
    });

    if (error) {
      log("UNEXPECTED ERROR: ", error);
      await sleep(CONSTANTS.TIME.BLOCK_TIME_MILLISECONDS);
    }
  }
}

export async function processAllVotes(
  api: ApiPromise,
  mnemonic: string,
  votes_on_pending: VotesByNumericId[],
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
  vote_info: VotesByNumericId,
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

      const [acceptError, res] = await tryAsyncLoggingRaw(
        acceptApplication(api, appId, mnemonic),
      );

      if (acceptError) {
        log(
          `Error accepting application ${appId}: ${acceptError instanceof Error ? acceptError.message : JSON.stringify(acceptError)}`,
        );
        return;
      }

      if (!res) {
        log(`No response from acceptApplication`);
        return;
      }

      console.log("acceptApplication executed:", res.toHuman());
    } else if (refuseVotes >= vote_threshold) {
      log(`Refusing proposal ${appId}`);

      const [denyError, res] = await tryAsyncLoggingRaw(
        denyApplication(api, appId, mnemonic),
      );

      if (denyError) {
        log(
          `Error denying application ${appId}: ${denyError instanceof Error ? denyError.message : JSON.stringify(denyError)}`,
        );
        return;
      }

      if (!res) {
        log(`No response from denyApplication`);
        return;
      }

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

    const [removeError, res] = await tryAsyncLoggingRaw(
      removeFromWhitelist(api, applications_map[appId].agentKey, mnemonic),
    );

    if (removeError) {
      log(
        `Error removing from whitelist for application ${appId}: ${removeError instanceof Error ? removeError.message : JSON.stringify(removeError)}`,
      );
      return;
    }
    if (!res) {
      log(`No response from removeFromWhitelist`);
      return;
    }

    console.log("removeFromWhitelist executed:", res.toHuman());
  }
}

export async function getVotesOnPending(
  applications_map: Record<number, AgentApplication>,
  last_block_number: number,
): Promise<VotesByNumericId[]> {
  const votes = await queryTotalVotesPerApp();
  const votes_on_pending = votes.filter((vote) => {
    const app = applications_map[vote.appId];
    if (app == null) return false;
    return applicationIsPending(app) && app.expiresAt > last_block_number;
  });
  return votes_on_pending;
}

// TODO: move `getCadreThreshold` to shared package
export async function getCadreThreshold() {
  const keys = await countCadreKeys();
  return Math.floor(keys / 2) + 1;
}

export async function getPenaltyThreshold() {
  const keys = await countCadreKeys();
  return Math.floor(Math.sqrt(keys)) + 1;
}

export async function getPenaltyFactors(cadreThreshold: number) {
  const nth_factor = Math.max(cadreThreshold - 1, 1);
  const penalizations = await pendingPenalizations(cadreThreshold, nth_factor);
  return penalizations;
}

export async function processPenalty(
  api: ApiPromise,
  mnemonic: string,
  penaltiesToApply: {
    agentKey: string;
    nthBiggestPenaltyFactor: number;
  }[],
) {
  console.log("Penalties to apply: ", penaltiesToApply);

  for (const penalty of penaltiesToApply) {
    const { agentKey, nthBiggestPenaltyFactor } = penalty;

    const [penaltyError] = await tryAsyncLoggingRaw(
      penalizeAgent(api, agentKey, nthBiggestPenaltyFactor, mnemonic),
    );

    if (penaltyError) {
      log(
        `Error penalizing agent ${agentKey}: ${penaltyError instanceof Error ? penaltyError.message : JSON.stringify(penaltyError)}`,
      );
      continue;
    }
  }

  const penalizedKeys = penaltiesToApply.map((item) => item.agentKey);

  const [updateError] = await tryAsyncLoggingRaw(
    updatePenalizeAgentVotes(penalizedKeys),
  );
  if (updateError) {
    log(
      `Error updating penalize agent votes: ${updateError instanceof Error ? updateError.message : JSON.stringify(updateError)}`,
    );
    return;
  }

  console.log("Penalties applied");
}
