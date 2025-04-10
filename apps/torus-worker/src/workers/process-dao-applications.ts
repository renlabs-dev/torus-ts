import type { ApiPromise } from "@polkadot/api";
import type { AgentApplication, SS58Address } from "@torus-network/sdk";
import {
  acceptApplication,
  CONSTANTS,
  denyApplication,
  penalizeAgent,
  queryAgents,
  removeFromWhitelist,
} from "@torus-network/sdk";
import { validateEnvOrExit } from "@torus-ts/utils/env";
import { tryAsync } from "@torus-ts/utils/try-catch";
import { z } from "zod";
import type { WorkerProps } from "../common";
import {
  applicationIsPending,
  getApplications,
  getApplicationVoteStatus,
  getCadreVotes,
  processCadreVotes,
  sleep,
  sleepUntilNewBlock,
} from "../common";
import { createLogger } from "../common/log";
import type { VotesByNumericId } from "../db";
import {
  countCadreKeys,
  getAgentKeysWithPenalties,
  pendingPenalizations,
  queryTotalVotesPerApp,
  updatePenalizeAgentVotes,
} from "../db";

const getEnv = validateEnvOrExit({
  TORUS_CURATOR_MNEMONIC: z
    .string()
    .nonempty("TORUS_CURATOR_MNEMONIC is required"),
});

const log = createLogger({ name: "process-dao-applications" });
const retryDelay = CONSTANTS.TIME.BLOCK_TIME_MILLISECONDS;

export async function processApplicationsWorker(props: WorkerProps) {
  const env = getEnv(process.env);
  while (true) {
    const [workerError, _] = await tryAsync(
      (async () => {
        const [sleepError, lastBlock] = await tryAsync(
          sleepUntilNewBlock(props),
        );
        if (sleepError !== undefined) {
          log.error(sleepError);
          await sleep(retryDelay);
          return;
        }

        props.lastBlock = lastBlock;
        log.info(`Block ${props.lastBlock.blockNumber}: processing`);

        const [getAppsError, apps_map] = await tryAsync(
          getApplications(props.api, applicationIsPending),
        );
        if (getAppsError !== undefined) {
          log.error(getAppsError);
          return;
        }

        const [getVotesError, votes_on_pending] = await tryAsync(
          getVotesOnPending(apps_map, lastBlock.blockNumber),
        );
        if (getVotesError !== undefined) {
          log.error(getVotesError);
          return;
        }

        const [thresholdError, vote_threshold] =
          await tryAsync(getCadreThreshold());
        if (thresholdError !== undefined) {
          log.error(thresholdError);
          return;
        }

        const mnemonic = env.TORUS_CURATOR_MNEMONIC;
        const [processVotesError, __] = await tryAsync(
          processAllVotes(
            props.api,
            mnemonic,
            votes_on_pending,
            vote_threshold,
            apps_map,
          ),
        );
        if (processVotesError !== undefined) {
          log.error(processVotesError);
          return;
        }

        const [cadreVotesError, cadreVotes] = await tryAsync(getCadreVotes());
        if (cadreVotesError !== undefined) {
          log.error(cadreVotesError);
          return;
        }

        const [processCadreError, ___] = await tryAsync(
          processCadreVotes(cadreVotes, vote_threshold),
        );
        if (processCadreError !== undefined) {
          log.error(processCadreError);
          return;
        }

        log.info(`Threshold: ${vote_threshold}`);

        const [penaltyThresholdError, penaltyVoteThreshold] = await tryAsync(
          getPenaltyThreshold(),
        );
        if (penaltyThresholdError !== undefined) {
          log.error(penaltyThresholdError);
          return;
        }

        log.info(`Penalty threshold: ${penaltyVoteThreshold}`);

        const [factorsError, factors] = await tryAsync(
          getPenaltyFactors(penaltyVoteThreshold),
        );
        if (factorsError !== undefined) {
          log.error(factorsError);
          return;
        }

        const [keysResetError, keysResetToPenaltyZero] = await tryAsync(
          getKeysToReset(props.api, penaltyVoteThreshold),
        );
        if (keysResetError !== undefined) {
          log.error(keysResetError);
          return;
        }

        factors.push(...keysResetToPenaltyZero);

        const [processPenaltyError, ____] = await tryAsync(
          processPenalty(props.api, mnemonic, factors),
        );
        if (processPenaltyError !== undefined) {
          log.error(processPenaltyError);
          return;
        }
      })(),
    );

    if (workerError !== undefined) {
      log.error(workerError);
      await sleep(retryDelay);
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
  log.info(`Processing votes for ${votes_on_pending.length} applications`);

  const processPromises = votes_on_pending.map(async (vote_info) => {
    const [processError, _] = await tryAsync(
      processVotesOnProposal(
        api,
        mnemonic,
        vote_info,
        vote_threshold,
        application_map,
      ),
    );

    if (processError !== undefined) {
      log.error(
        `Failed to process vote for app ID ${vote_info.appId}: ${processError}`,
      );
    }
  });

  await Promise.all(processPromises);
  log.info("All votes processed");
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
  log.info(
    `Application ${appId} [${appVoteStatus}] votes[ accept:${acceptVotes}, refuse:${refuseVotes}, remove:${removeVotes} ]`,
  );

  // Application is open and we have votes to accept or refuse
  if (appVoteStatus == "open") {
    if (acceptVotes >= vote_threshold) {
      log.info(`Accepting proposal ${appId} ${app.agentKey}`);
      const [acceptError, acceptResult] = await tryAsync(
        acceptApplication(api, appId, mnemonic),
      );

      if (acceptError !== undefined) {
        log.error(`Failed to accept application ${appId}: ${acceptError}`);
        return;
      }

      log.info(
        `Accept application executed for ${appId}: ${JSON.stringify(acceptResult.toHuman())}`,
      );
    } else if (refuseVotes >= vote_threshold) {
      log.info(`Refusing proposal ${appId}`);
      const [denyError, denyResult] = await tryAsync(
        denyApplication(api, appId, mnemonic),
      );

      if (denyError !== undefined) {
        log.error(`Failed to deny application ${appId}: ${denyError}`);
        return;
      }

      log.info(
        `Deny application executed for ${appId}: ${JSON.stringify(denyResult)}`,
      );
    }
  } else if (
    appVoteStatus == "accepted" &&
    removeVotes >= vote_threshold &&
    applications_map[appId] !== undefined
  ) {
    log.info(`Removing proposal ${appId}`);
    // Note: if chain is updated to include revoking logic, this should be
    // `revokeApplication` instead of `removeFromWhitelist`
    const [removeError, removeResult] = await tryAsync(
      removeFromWhitelist(api, applications_map[appId].agentKey, mnemonic),
    );

    if (removeError !== undefined) {
      log.error(
        `Failed to remove from whitelist for application ${appId}: ${removeError}`,
      );
      return;
    }

    log.info(
      `Remove from whitelist executed for ${appId}: ${JSON.stringify(removeResult.toHuman())}`,
    );
  }
}

export async function getVotesOnPending(
  applications_map: Record<number, AgentApplication>,
  last_block_number: number,
): Promise<VotesByNumericId[]> {
  const [votesError, votes] = await tryAsync(queryTotalVotesPerApp());
  if (votesError !== undefined) {
    log.error(votesError);
    return [];
  }

  const votes_on_pending = votes.filter((vote) => {
    const app = applications_map[vote.appId];
    if (app == null) return false;
    return applicationIsPending(app) && app.expiresAt > last_block_number;
  });

  log.info(`Found ${votes_on_pending.length} pending applications with votes`);
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

async function getKeysToReset(api: ApiPromise, penaltyThreshold: number) {
  const agentPenaltyVotes = await getAgentKeysWithPenalties();

  const voteCountByAgentKey = new Map(
    agentPenaltyVotes.map(({ agentKey, count }) => [agentKey, count]),
  );

  const agentsMap = await queryAgents(api);

  const keysToResetPenalty: {
    agentKey: SS58Address;
    nthBiggestPenaltyFactor: number;
  }[] = [];

  for (const [agentKey, agent] of agentsMap) {
    const hasCurrentPenalty = agent.weightPenaltyFactor > 0;
    const voteCount = voteCountByAgentKey.get(agentKey) ?? 0;

    if (hasCurrentPenalty && voteCount < penaltyThreshold) {
      log.info(
        `Agent ${agentKey} penalty votes (${voteCount}) below threshold (${penaltyThreshold})`,
      );
      keysToResetPenalty.push({
        agentKey: agentKey,
        nthBiggestPenaltyFactor: 0,
      });
    }
  }

  return keysToResetPenalty;
}

export async function processPenalty(
  api: ApiPromise,
  mnemonic: string,
  penaltiesToApply: {
    agentKey: SS58Address;
    nthBiggestPenaltyFactor: number;
  }[],
) {
  log.info(`Penalties to apply: ${JSON.stringify(penaltiesToApply)}`);

  const [agentsError, agentsMap] = await tryAsync(queryAgents(api));
  if (agentsError !== undefined) {
    log.error(`Failed to query agents: ${agentsError}`);
    return;
  }

  const allProcessedKeys: SS58Address[] = [];

  for (const penalty of penaltiesToApply) {
    const { agentKey, nthBiggestPenaltyFactor } = penalty;
    const agent = agentsMap.get(agentKey);

    if (agent && nthBiggestPenaltyFactor !== agent.weightPenaltyFactor) {
      const [penalizeError, _] = await tryAsync(
        penalizeAgent(api, agentKey, nthBiggestPenaltyFactor, mnemonic),
      );

      if (penalizeError !== undefined) {
        log.error(
          `Failed to apply penalty to agent ${agentKey}: ${penalizeError}`,
        );
        continue;
      }

      log.info(
        `Applied penalty factor ${nthBiggestPenaltyFactor} to agent ${agentKey}`,
      );
      allProcessedKeys.push(agentKey);
    }
  }

  if (allProcessedKeys.length > 0) {
    const [updateError, _] = await tryAsync(
      updatePenalizeAgentVotes(allProcessedKeys),
    );
    if (updateError !== undefined) {
      log.error(`Failed to update penalty votes: ${updateError}`);
      return;
    }
    log.info(`Penalties updated for ${allProcessedKeys.length} agents`);
  } else {
    log.info("No penalties required updates");
  }
}
