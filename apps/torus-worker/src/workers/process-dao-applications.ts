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
import { validateEnvOrExit } from "@torus-network/torus-utils/env";
import { BasicLogger } from "@torus-network/torus-utils/logger";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
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

const log = BasicLogger.create({ name: "process-dao-applications" });
const retryDelay = CONSTANTS.TIME.BLOCK_TIME_MILLISECONDS;

/**
 * Processes DAO governance actions based on accumulated cadre votes.
 * Handles application approvals/denials, whitelist removals, and agent penalties
 * in a continuous loop with error handling for blockchain interactions.
 *
 * @param props - Contains API connection and state for tracking the last processed block
 */
export async function processApplicationsWorker(props: WorkerProps) {
  const env = getEnv(process.env);
  while (true) {
    const workerRes = await tryAsync(
      (async () => {
        const sleepRes = await tryAsync(sleepUntilNewBlock(props));
        if (log.ifResultIsErr(sleepRes)) {
          await sleep(retryDelay);
          return;
        }
        const [_sleepErr, lastBlock] = sleepRes;

        props.lastBlock = lastBlock;
        log.info(`Block ${props.lastBlock.blockNumber}: processing`);

        const getAppsRes = await tryAsync(
          getApplications(props.api, applicationIsPending),
        );
        if (log.ifResultIsErr(getAppsRes)) return;
        const [_getAppsErr, apps_map] = getAppsRes;

        const getVotesRes = await tryAsync(
          getVotesOnPending(apps_map, lastBlock.blockNumber),
        );
        if (log.ifResultIsErr(getVotesRes)) return;
        const [_getVotesErr, votes_on_pending] = getVotesRes;

        const thresholdRes = await tryAsync(getCadreThreshold());
        if (log.ifResultIsErr(thresholdRes)) return;
        const [_thresholdErr, vote_threshold] = thresholdRes;

        const mnemonic = env.TORUS_CURATOR_MNEMONIC;
        const processVotesRes = await tryAsync(
          processAllVotes(
            props.api,
            mnemonic,
            votes_on_pending,
            vote_threshold,
            apps_map,
          ),
        );
        if (log.ifResultIsErr(processVotesRes)) return;

        const cadreVotesRes = await tryAsync(getCadreVotes());
        if (log.ifResultIsErr(cadreVotesRes)) return;
        const [_cadreVotesErr, cadreVotes] = cadreVotesRes;

        const processCadreRes = await tryAsync(
          processCadreVotes(cadreVotes, vote_threshold),
        );
        if (log.ifResultIsErr(processCadreRes)) return;

        log.info(`Threshold: ${vote_threshold}`);

        const penaltyThresholdRes = await tryAsync(getPenaltyThreshold());
        if (log.ifResultIsErr(penaltyThresholdRes)) return;
        const [_penaltyThresholdErr, penaltyVoteThreshold] =
          penaltyThresholdRes;

        log.info(`Penalty threshold: ${penaltyVoteThreshold}`);

        const factorsRes = await tryAsync(
          getPenaltyFactors(penaltyVoteThreshold),
        );
        if (log.ifResultIsErr(factorsRes)) return;
        const [_factorsErr, factors] = factorsRes;

        const keysResetRes = await tryAsync(
          getKeysToReset(props.api, penaltyVoteThreshold),
        );
        if (log.ifResultIsErr(keysResetRes)) return;
        const [_keysResetErr, keysResetToPenaltyZero] = keysResetRes;

        factors.push(...keysResetToPenaltyZero);

        const processPenaltyRes = await tryAsync(
          processPenalty(props.api, mnemonic, factors),
        );
        if (log.ifResultIsErr(processPenaltyRes)) return;
      })(),
    );

    if (log.ifResultIsErr(workerRes)) {
      await sleep(retryDelay);
    }
  }
}

/**
 * Processes votes across multiple applications in parallel.
 * Aggregates threshold-exceeding votes and executes on-chain governance actions.
 *
 * @param api - Polkadot API instance for blockchain interaction
 * @param mnemonic - Curator account credentials for submitting transactions
 * @param votes_on_pending - Vote tallies for each pending application
 * @param vote_threshold - Minimum votes required to execute governance actions
 * @param application_map - Reference map of application details from the blockchain
 *
 */
export async function processAllVotes(
  api: ApiPromise,
  mnemonic: string,
  votes_on_pending: VotesByNumericId[],
  vote_threshold: number,
  application_map: Record<number, AgentApplication>,
) {
  log.info(`Processing votes for ${votes_on_pending.length} applications`);

  const processPromises = votes_on_pending.map(async (vote_info) => {
    const processRes = await tryAsync(
      processVotesOnProposal(
        api,
        mnemonic,
        vote_info,
        vote_threshold,
        application_map,
      ),
    );

    const processErroMsg = () =>
      `Failed to process vote for app ID ${vote_info.appId}`;
    if (log.ifResultIsErr(processRes, processErroMsg)) return;
  });

  await Promise.all(processPromises);
  log.info("All votes processed");
}

/**
 * Executes the appropriate on-chain governance action for a single application
 * based on accumulated votes and current application status.
 *
 * Handles three distinct flows:
 * 1. Accept pending applications when accept votes meet threshold
 * 2. Deny pending applications when refuse votes meet threshold
 * 3. Remove previously accepted agents when removal votes meet threshold
 *
 * @param api - Polkadot API instance for blockchain interaction
 * @param mnemonic - Curator account credentials for submitting transactions
 * @param vote_info - Vote counts for accept/refuse/remove actions
 * @param vote_threshold - Minimum votes required to execute governance actions
 * @param applications_map - Reference map of application details from the blockchain
 */
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
      const acceptRes = await tryAsync(acceptApplication(api, appId, mnemonic));

      const acceptErrorMsg = () => `Failed to accept application ${appId}:`;
      if (log.ifResultIsErr(acceptRes, acceptErrorMsg)) return;
      const [_acceptErr, acceptResult] = acceptRes;

      log.info(
        `Accept application executed for ${appId}: ${JSON.stringify(acceptResult.toHuman())}`,
      );
    } else if (refuseVotes >= vote_threshold) {
      log.info(`Refusing proposal ${appId}`);
      const denyRes = await tryAsync(denyApplication(api, appId, mnemonic));

      const denyErrorMsg = () => `Failed to deny application ${appId}:`;
      if (log.ifResultIsErr(denyRes, denyErrorMsg)) return;
      const [_denyErr, denyResult] = denyRes;

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
    const removeRes = await tryAsync(
      removeFromWhitelist(api, applications_map[appId].agentKey, mnemonic),
    );

    const removeErrorMsg = () =>
      `Failed to remove from whitelist for application ${appId}:`;
    if (log.ifResultIsErr(removeRes, removeErrorMsg)) return;
    const [_removeErr, removeResult] = removeRes;

    log.info(
      `Remove from whitelist executed for ${appId}: ${JSON.stringify(removeResult.toHuman())}`,
    );
  }
}

/**
 * Filters application votes to only include those that are still pending
 * and have not expired at the current block height.
 *
 * @param applications_map - Map of all applications indexed by ID
 * @param last_block_number - Current blockchain height
 * @returns Vote tallies for active pending applications
 */
export async function getVotesOnPending(
  applications_map: Record<number, AgentApplication>,
  last_block_number: number,
): Promise<VotesByNumericId[]> {
  const votesRes = await tryAsync(queryTotalVotesPerApp());
  if (log.ifResultIsErr(votesRes)) return [];
  const [_votesErr, votes] = votesRes;

  const votes_on_pending = votes.filter((vote) => {
    const app = applications_map[vote.appId];
    if (app == null) return false;
    return applicationIsPending(app) && app.expiresAt > last_block_number;
  });

  log.info(`Found ${votes_on_pending.length} pending applications with votes`);
  return votes_on_pending;
}

/**
 * Calculates the vote threshold required for governance actions.
 * Uses a simple majority rule (floor(n/2) + 1) based on current cadre size.
 *
 * @returns Number of votes required to pass governance actions
 */
export async function getCadreThreshold() {
  const keys = await countCadreKeys();
  return Math.floor(keys / 2) + 1;
}

/**
 * Calculates the vote threshold for agent penalties.
 * Uses a square root rule (floor(sqrt(n)) + 1) to scale reasonably with council size.
 *
 * @returns Number of votes required to apply or remove agent penalties
 */
export async function getPenaltyThreshold() {
  const keys = await countCadreKeys();
  return Math.floor(Math.sqrt(keys)) + 1;
}

/**
 * Identifies agents that have received sufficient penalty votes
 * and determines the penalty factor to apply to each.
 *
 * @param cadreThreshold - Minimum votes needed to apply a penalty
 * @returns List of agents with their calculated penalty factors
 */
export async function getPenaltyFactors(cadreThreshold: number) {
  const nth_factor = Math.max(cadreThreshold - 1, 1);

  const penalizations = await pendingPenalizations(cadreThreshold, nth_factor);
  return penalizations;
}

/**
 * Identifies agents with active penalties that should be reset to zero
 * because their penalty votes have fallen below the required threshold.
 *
 * Compares on-chain penalty state with current vote counts to identify
 * candidates for penalty removal.
 *
 * @param api - Polkadot API instance for querying current agent state
 * @param penaltyThreshold - Minimum votes needed to maintain a penalty
 * @returns List of agents whose penalties should be reset to zero
 */
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

/**
 * Applies calculated penalty factors to agents on-chain.
 * Only executes transactions for agents whose penalty factor differs from current state.
 * Updates the vote tracking database after successful transactions.
 *
 * @param api - Polkadot API instance for blockchain interaction
 * @param mnemonic - Curator account credentials for submitting transactions
 * @param penaltiesToApply - List of agents with their calculated penalty factors
 */
export async function processPenalty(
  api: ApiPromise,
  mnemonic: string,
  penaltiesToApply: {
    agentKey: SS58Address;
    nthBiggestPenaltyFactor: number;
  }[],
) {
  log.info(`Penalties to apply: ${JSON.stringify(penaltiesToApply)}`);

  const agentsRes = await tryAsync(queryAgents(api));
  const agentsErrorMsg = () => "Failed to query agents:";
  if (log.ifResultIsErr(agentsRes, agentsErrorMsg)) return;
  const [_agentsErr, agentsMap] = agentsRes;

  const allProcessedKeys: SS58Address[] = [];

  for (const penalty of penaltiesToApply) {
    const { agentKey, nthBiggestPenaltyFactor } = penalty;
    const agent = agentsMap.get(agentKey);

    if (agent && nthBiggestPenaltyFactor !== agent.weightPenaltyFactor) {
      const penalizeRes = await tryAsync(
        penalizeAgent(api, agentKey, nthBiggestPenaltyFactor, mnemonic),
      );

      const penalizeErrorMsg = () =>
        `Failed to apply penalty to agent ${agentKey}:`;
      if (log.ifResultIsErr(penalizeRes, penalizeErrorMsg)) continue;
      log.info(
        `Applied penalty factor ${nthBiggestPenaltyFactor} to agent ${agentKey}`,
      );

      allProcessedKeys.push(agentKey);
    }
  }

  if (allProcessedKeys.length > 0) {
    const updateRes = await tryAsync(
      updatePenalizeAgentVotes(allProcessedKeys),
    );
    const updateErrorMsg = () => "Failed to update penalty votes:";
    if (log.ifResultIsErr(updateRes, updateErrorMsg)) return;

    log.info(`Penalties updated for ${allProcessedKeys.length} agents`);
  } else {
    log.info("No penalties required updates");
  }
}
