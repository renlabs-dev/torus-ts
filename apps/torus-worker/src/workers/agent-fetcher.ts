import type { LastBlock, Proposal, SS58Address, PermissionContract, PermissionId } from "@torus-network/sdk";
import {
  checkSS58,
  CONSTANTS,
  queryAgents,
  queryLastBlock,
  queryWhitelist,
  queryPermissions,
} from "@torus-network/sdk";
import { BasicLogger } from "@torus-network/torus-utils/logger";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { match } from "rustie";
import type { WorkerProps } from "../common";
import {
  agentApplicationToApplication,
  agentProposalToProposal,
  getApplications,
  getProposals,
  getProposalStatus,
  normalizeApplicationValue,
  sleep,
} from "../common";
import type { NewApplication, NewProposal, NewPermission, NewEmissionPermission, NewEmissionStreamAllocation, NewEmissionDistributionTarget, NewPermissionEnforcementController, NewPermissionRevocationArbiter, NewPermissionHierarchy } from "../db";
import {
  queryProposalsDB,
  SubspaceAgentToDatabase,
  upsertAgentData,
  upsertProposal,
  upsertWhitelistApplication,
  upsertPermissions,
} from "../db";

const log = BasicLogger.create({ name: "agent-fetcher" });

// Constants for error handling configuration
const retryDelay = CONSTANTS.TIME.BLOCK_TIME_MILLISECONDS;

/**
 * Transforms a blockchain permission contract to database format
 */
function permissionContractToDatabase(
  permissionId: PermissionId,
  contract: PermissionContract,
): {
  permission: NewPermission;
  emissionPermission?: NewEmissionPermission;
  streamAllocations?: NewEmissionStreamAllocation[];
  distributionTargets?: NewEmissionDistributionTarget[];
  enforcementControllers?: NewPermissionEnforcementController[];
  revocationArbiters?: NewPermissionRevocationArbiter[];
  hierarchy?: NewPermissionHierarchy;
} | null {
  // Only process emission permissions, skip curator permissions
  const isEmissionPermission = match(contract.scope)({
    Emission: () => true,
    Curator: () => false,
  });

  if (!isEmissionPermission) {
    return null; // Skip curator permissions
  }

  // Map duration
  const durationType = match(contract.duration)({
    Indefinite: () => "indefinite" as const,
    UntilBlock: () => "until_block" as const,
  });

  const durationBlockNumber = match(contract.duration)({
    Indefinite: () => null,
    UntilBlock: (block) => BigInt(block.toString()),
  });

  // Map revocation terms
  const revocationType = match(contract.revocation)({
    Irrevocable: () => "irrevocable" as const,
    RevocableByGrantor: () => "revocable_by_grantor" as const,
    RevocableByArbiters: () => "revocable_by_arbiters" as const,
    RevocableAfter: () => "revocable_after" as const,
  });

  const revocationBlockNumber = match(contract.revocation)({
    RevocableAfter: (block) => BigInt(block.toString()),
    Irrevocable: () => null,
    RevocableByGrantor: () => null,
    RevocableByArbiters: () => null,
  });

  const revocationRequiredVotes = match(contract.revocation)({
    RevocableByArbiters: (arbiters) => BigInt(arbiters.requiredVotes.toString()),
    Irrevocable: () => null,
    RevocableByGrantor: () => null,
    RevocableAfter: () => null,
  });

  // Map enforcement authority
  const enforcementType = match(contract.enforcement)({
    None: () => "none" as const,
    ControlledBy: () => "controlled_by" as const,
  });

  const enforcementRequiredVotes = match(contract.enforcement)({
    ControlledBy: (controlled) => BigInt(controlled.requiredVotes.toString()),
    None: () => null,
  });

  const permission: NewPermission = {
    permissionId: permissionId,
    grantorAccountId: contract.grantor,
    granteeAccountId: contract.grantee,
    durationType,
    durationBlockNumber,
    revocationType,
    revocationBlockNumber,
    revocationRequiredVotes,
    enforcementType,
    enforcementRequiredVotes,
    lastExecutionBlock: match(contract.lastExecution)({
      Some: (block) => BigInt(block.toString()),
      None: () => null,
    }),
    executionCount: Number(contract.executionCount.toString()),
    createdAtBlock: BigInt(contract.createdAt.toString()),
  };

  // Handle parent hierarchy
  const hierarchy = match(contract.parent)({
    Some: (parentId): NewPermissionHierarchy => ({
      childPermissionId: permissionId,
      parentPermissionId: parentId,
    }),
    None: () => undefined,
  });

  let emissionPermission: NewEmissionPermission | undefined;
  let streamAllocations: NewEmissionStreamAllocation[] | undefined;
  let distributionTargets: NewEmissionDistributionTarget[] | undefined;
  let enforcementControllers: NewPermissionEnforcementController[] | undefined;
  let revocationArbiters: NewPermissionRevocationArbiter[] | undefined;

  // Handle emission scope - now we process both streams and fixed amounts
  match(contract.scope)({
    Emission: (emission) => {
      // Map allocation type
      const allocationType = match(emission.allocation)({
        Streams: () => "streams" as const,
        FixedAmount: () => "fixed_amount" as const,
      });

      // Map distribution type
      const distributionType = match(emission.distribution)({
        Manual: () => "manual" as const,
        Automatic: () => "automatic" as const,
        AtBlock: () => "at_block" as const,
        Interval: () => "interval" as const,
      });

      // Extract distribution-specific data
      const distributionThreshold = match(emission.distribution)({
        Automatic: (auto) => auto.toString(),
        Manual: () => null,
        AtBlock: () => null,
        Interval: () => null,
      });

      const distributionTargetBlock = match(emission.distribution)({
        AtBlock: (atBlock) => BigInt(atBlock.toString()),
        Manual: () => null,
        Automatic: () => null,
        Interval: () => null,
      });

      const distributionIntervalBlocks = match(emission.distribution)({
        Interval: (interval) => BigInt(interval.toString()),
        Manual: () => null,
        Automatic: () => null,
        AtBlock: () => null,
      });

      // Extract fixed amount (if applicable)
      const fixedAmount = match(emission.allocation)({
        FixedAmount: (amount) => amount.toString(),
        Streams: () => null,
      });

      emissionPermission = {
        permissionId: permissionId,
        allocationType,
        fixedAmount,
        distributionType,
        distributionThreshold,
        distributionTargetBlock,
        distributionIntervalBlocks,
        accumulating: emission.accumulating,
      };

      // Handle stream allocations (if streams-based)
      match(emission.allocation)({
        Streams: (streams) => {
          streamAllocations = Array.from(streams.entries()).map(([streamId, percentage]) => ({
            permissionId: permissionId,
            streamId: streamId,
            percentage: percentage, // 0-100, matches Substrate Percent type
          }));
        },
        FixedAmount: () => {
          // No stream allocations for fixed amount
        },
      });

      // Handle distribution targets (all emission permissions have targets)
      distributionTargets = Array.from(emission.targets.entries()).map(([accountId, weight]) => ({
        permissionId: permissionId,
        targetAccountId: accountId,
        weight: Number(weight.toString()), // Convert bigint to number (u16 range: 0-65535)
      }));
    },
    Curator: () => {
      // This case should never be reached due to early return above
    },
  });


  // Handle enforcement authorities
  match(contract.enforcement)({
    ControlledBy: (controlled) => {
      enforcementControllers = controlled.controllers.map(
        (controller: SS58Address): NewPermissionEnforcementController => ({
          permissionId: permissionId,
          accountId: controller,
        })
      );
    },
    None: () => {
      // No enforcement authorities
    },
  });

  // Handle revocation arbiters
  match(contract.revocation)({
    RevocableByArbiters: (arbiters) => {
      revocationArbiters = arbiters.accounts.map(
        (arbiter: SS58Address): NewPermissionRevocationArbiter => ({
          permissionId: permissionId,
          accountId: arbiter,
        })
      );
    },
    Irrevocable: () => {
      // No revocation arbiters for other revocation types
    },
    RevocableByGrantor: () => {
      // No revocation arbiters for other revocation types
    },
    RevocableAfter: () => {
      // No revocation arbiters for other revocation types
    },
  });

  return {
    permission,
    emissionPermission,
    streamAllocations,
    distributionTargets,
    enforcementControllers,
    revocationArbiters,
    hierarchy,
  };
}

/**
 * Synchronizes on-chain agent data to the database for a given block height.
 * Handles whitelist status checks and transforms blockchain data to database format.
 *
 * @param lastBlock - Contains blockchain API instance frozen at a specific block height
 */
export async function runAgentFetch(lastBlock: LastBlock) {
  const startTime = new Date();
  const api = lastBlock.apiAtBlock;
  const blockNumber = lastBlock.blockNumber;

  log.info(`Block ${blockNumber}: running agent fetch`);

  const whitelistRes = await tryAsync(queryWhitelist(api));
  if (log.ifResultIsErr(whitelistRes)) return;
  const [_whitelistErr, whitelist] = whitelistRes;

  const agentsRes = await tryAsync(queryAgents(api));
  if (log.ifResultIsErr(agentsRes)) return;
  const [_agentsErr, agentsMap] = agentsRes;

  const whitelistSet = new Set(whitelist);
  const isWhitelisted = (addr: SS58Address) => whitelistSet.has(addr);
  const agents = [...agentsMap.values()];
  const agentsData = agents.map((agent) =>
    SubspaceAgentToDatabase(
      agent,
      blockNumber,
      isWhitelisted(checkSS58(agent.key)),
    ),
  );

  log.info(`Block ${blockNumber}: upserting ${agents.length} agents`);

  const upserAgentDataRes = await tryAsync(upsertAgentData(agentsData));
  if (log.ifResultIsErr(upserAgentDataRes)) return;

  const timeDelta = new Date().getTime() - startTime.getTime();
  log.info(
    `Block ${blockNumber}: agent data upserted in ${timeDelta / 1000} seconds`,
  );
}

/**
 * Captures all whitelist applications from the blockchain at a specific block height.
 * This always processes the complete set of applications to maintain full audit history.
 *
 * @param lastBlock - Contains blockchain API instance frozen at a specific block height
 */
export async function runApplicationsFetch(lastBlock: LastBlock) {
  const lastBlockNumber = lastBlock.blockNumber;
  log.info(`Block ${lastBlockNumber}: running applications fetch`);

  const applicationsRes = await tryAsync(
    getApplications(lastBlock.apiAtBlock, (_) => true),
  );
  if (log.ifResultIsErr(applicationsRes)) return;
  const [_applicationsErr, applications] = applicationsRes;

  const applicationsMap = new Map(Object.entries(applications));
  const dbApplications: NewApplication[] = [];
  applicationsMap.forEach((value, _) => {
    dbApplications.push(agentApplicationToApplication(value));
  });

  log.info(
    `Block ${lastBlockNumber}: upserting ${dbApplications.length} applications`,
  );

  const upsertWhitelistApplicationRes = await tryAsync(
    upsertWhitelistApplication(dbApplications),
  );
  if (log.ifResultIsErr(upsertWhitelistApplicationRes)) return;
  log.info(`Block ${lastBlockNumber}: applications upserted`);
}

/**
 * Performs differential synchronization of blockchain proposals to database.
 * Optimizes database operations by only processing proposals that are new or have
 * changed status since the last sync.
 *
 * @param lastBlock - Contains blockchain API instance frozen at a specific block height
 */
export async function runProposalsFetch(lastBlock: LastBlock) {
  const lastBlockNumber = lastBlock.blockNumber;
  log.info(`Block ${lastBlockNumber}: running proposals fetch`);

  const queryProposalsRes = await tryAsync(queryProposalsDB());
  if (log.ifResultIsErr(queryProposalsRes)) return;
  const [_queryProposalsError, queryProposalsResult] = queryProposalsRes;

  const savedProposalsMap = new Map(
    queryProposalsResult.map((proposal) => [proposal.id, proposal]),
  );
  const isProposalToInsert = (a: Proposal) => {
    const existingProposal = savedProposalsMap.get(a.id);
    const isNewProposal = !existingProposal;
    const hasStatusChanged =
      !isNewProposal &&
      getProposalStatus(a) !==
        normalizeApplicationValue(existingProposal.status);
    return isNewProposal || hasStatusChanged;
  };

  const getProrposalsRes = await tryAsync(
    getProposals(lastBlock.apiAtBlock, isProposalToInsert),
  );
  if (log.ifResultIsErr(getProrposalsRes)) return;
  const [_getProposalsError, proposalsResult] = getProrposalsRes;

  const proposalsMap = new Map(Object.entries(proposalsResult));
  const dbProposals: NewProposal[] = [];
  proposalsMap.forEach((value, _) => {
    dbProposals.push(agentProposalToProposal(value));
  });

  log.info(
    `Block ${lastBlockNumber}: upserting ${dbProposals.length} proposals`,
  );

  const upsertProposalRes = await tryAsync(upsertProposal(dbProposals));
  if (log.ifResultIsErr(upsertProposalRes)) return;

  log.info(`Block ${lastBlockNumber}: proposals upserted`);
}

/**
 * Fetches all permissions from the blockchain and stores them in the database.
 * This captures the complete state of all permissions at a specific block height.
 *
 * @param lastBlock - Contains blockchain API instance frozen at a specific block height
 */
export async function runPermissionsFetch(lastBlock: LastBlock) {
  const lastBlockNumber = lastBlock.blockNumber;
  log.info(`Block ${lastBlockNumber}: running permissions fetch`);

  const permissionsQueryResult = await queryPermissions(lastBlock.apiAtBlock);
  const [permissionsMapErr, permissionsMap] = permissionsQueryResult;
  if (permissionsMapErr) {
    log.error(`Block ${lastBlockNumber}: queryPermissions failed:`, permissionsMapErr);
    return;
  }

  log.info(`Block ${lastBlockNumber}: found ${permissionsMap.size} permissions from blockchain`);

  const permissionsData: {
    permission: NewPermission;
    emissionPermission?: NewEmissionPermission;
    streamAllocations?: NewEmissionStreamAllocation[];
    distributionTargets?: NewEmissionDistributionTarget[];
    enforcementControllers?: NewPermissionEnforcementController[];
    revocationArbiters?: NewPermissionRevocationArbiter[];
    hierarchy?: NewPermissionHierarchy;
  }[] = [];

  // Transform each permission to database format  
  for (const [permissionId, contract] of permissionsMap.entries()) {
    try {
      const permissionData = permissionContractToDatabase(permissionId, contract);
      if (permissionData) {
        permissionsData.push(permissionData);
        log.info(`Block ${lastBlockNumber}: added emission permission ${permissionId} to batch`);
      } else {
        log.info(`Block ${lastBlockNumber}: skipped curator permission ${permissionId}`);
      }
    } catch (error) {
      log.error(`Failed to transform permission ${permissionId}:`, error);
      continue; // Skip this permission but continue with others
    }
  }

  log.info(
    `Block ${lastBlockNumber}: upserting ${permissionsData.length} permissions`,
  );

  const upsertPermissionsRes = await tryAsync(upsertPermissions(permissionsData));
  if (log.ifResultIsErr(upsertPermissionsRes)) return;

  log.info(`Block ${lastBlockNumber}: permissions upserted`);
}

/**
 * Blockchain data synchronization in an infinite loop.
 * Processes each new block once, skips already processed blocks, and handles
 * all errors internally to ensure the synchronization process never terminates.
 *
 * @param props - Contains API connection and state for tracking the last processed block
 */
export async function agentFetcherWorker(props: WorkerProps) {
  while (true) {
    const fetchWorkerRes = await tryAsync(
      (async () => {
        // Get latest block information with error logging
        const queryLastBlockRes = await tryAsync(queryLastBlock(props.api));
        if (log.ifResultIsErr(queryLastBlockRes)) {
          await sleep(CONSTANTS.TIME.BLOCK_TIME_MILLISECONDS);
          return;
        }
        const [_queryLastBlockError, lastBlock] = queryLastBlockRes;

        const lastBlockNumber = lastBlock.blockNumber;

        // Check if the last queried block is a new block
        if (props.lastBlock.blockNumber === lastBlockNumber) {
          log.info(
            `Block ${props.lastBlock.blockNumber}: already processed, skipping`,
          );
          await sleep(CONSTANTS.TIME.BLOCK_TIME_MILLISECONDS);
          return;
        }
        props.lastBlock = lastBlock;

        log.info(`Block ${lastBlockNumber}: processing`);

        await runAgentFetch(lastBlock);
        await runApplicationsFetch(lastBlock);
        await runProposalsFetch(lastBlock);
        await runPermissionsFetch(lastBlock);
      })(),
    );
    if (log.ifResultIsErr(fetchWorkerRes)) {
      await sleep(retryDelay);
    }
  }
}
