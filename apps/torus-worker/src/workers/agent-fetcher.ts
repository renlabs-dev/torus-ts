import { match } from "rustie";

import type {
  EmissionScope,
  LastBlock,
  NamespaceScope,
  PermissionContract,
  PermissionId,
  Proposal,
} from "@torus-network/sdk/chain";
import {
  EMISSION_SCOPE_SCHEMA,
  NAMESPACE_SCOPE_SCHEMA,
  queryAgents,
  queryLastBlock,
  queryPermissions,
  queryWhitelist,
} from "@torus-network/sdk/chain";
import { CONSTANTS } from "@torus-network/sdk/constants";
import type { SS58Address } from "@torus-network/sdk/types";
import { checkSS58 } from "@torus-network/sdk/types";
import { BasicLogger } from "@torus-network/torus-utils/logger";
import { tryAsync } from "@torus-network/torus-utils/try-catch";

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
import type {
  NewApplication,
  NewEmissionDistributionTarget,
  NewEmissionPermission,
  NewEmissionStreamAllocation,
  NewNamespacePermission,
  NewNamespacePermissionPath,
  NewPermission,
  NewPermissionEnforcementController,
  NewPermissionHierarchy,
  NewPermissionRevocationArbiter,
  NewProposal,
} from "../db";
import {
  deleteAgents,
  deletePermissions,
  getAllAgentKeys,
  getAllPermissionIds,
  queryProposalsDB,
  SubspaceAgentToDatabase,
  upsertAgentData,
  upsertPermissions,
  upsertProposal,
  upsertWhitelistApplication,
} from "../db";

const log = BasicLogger.create({ name: "agent-fetcher" });

// Constants for error handling configuration
const retryDelay = CONSTANTS.TIME.BLOCK_TIME_MILLISECONDS;

/**
 * Cleans up agents that no longer exist on the blockchain
 */
async function cleanAgents(
  onChainAgents: Set<SS58Address>,
  blockNumber: number,
): Promise<void> {
  const getAllAgentKeysRes = await tryAsync(getAllAgentKeys());
  if (log.ifResultIsErr(getAllAgentKeysRes)) return;
  const [_getAllAgentKeysErr, dbAgentKeys] = getAllAgentKeysRes;

  const agentsToDelete = dbAgentKeys.filter(
    (key) => !onChainAgents.has(checkSS58(key)),
  );

  if (agentsToDelete.length > 0) {
    log.info(
      `Block ${blockNumber}: hard deleting ${agentsToDelete.length} agents that are no longer on-chain`,
    );
    const deleteAgentsRes = await tryAsync(deleteAgents(agentsToDelete));
    if (log.ifResultIsErr(deleteAgentsRes)) return;
  }
}

/**
 * Cleans up permissions that no longer exist on the blockchain
 */
async function cleanPermissions(
  permissionsMap: Map<PermissionId, PermissionContract>,
  blockNumber: number,
): Promise<void> {
  const getAllPermissionIdsRes = await tryAsync(getAllPermissionIds());
  if (log.ifResultIsErr(getAllPermissionIdsRes)) return;
  const [_getAllPermissionIdsErr, dbPermissionIds] = getAllPermissionIdsRes;

  const onChainPermissionIds = new Set(Array.from(permissionsMap.keys()));
  const permissionsToDelete = dbPermissionIds.filter(
    // TODO: change the db schema to use the permission ID type
    (id) => !onChainPermissionIds.has(id as PermissionId),
  );

  console.log(
    `Block ${blockNumber}: hard deleting ${permissionsToDelete.length} permissions that are no longer on-chain`,
  );
  if (permissionsToDelete.length > 0) {
    log.info(
      `Block ${blockNumber}: hard deleting ${permissionsToDelete.length} permissions that are no longer on-chain`,
    );
    const deletePermissionsRes = await tryAsync(
      deletePermissions(permissionsToDelete),
    );
    if (log.ifResultIsErr(deletePermissionsRes)) return;
  }
}

/**
 * Transforms emission permission data to database format
 */
function emissionToDatabase(
  permissionId: PermissionId,
  emission: EmissionScope,
): {
  emissionPermission: NewEmissionPermission;
  streamAllocations: NewEmissionStreamAllocation[];
  distributionTargets: NewEmissionDistributionTarget[];
} {
  const allocationType = match(emission.allocation)({
    Streams: () => "streams" as const,
    FixedAmount: () => "fixed_amount" as const,
  });

  const distributionType = match(emission.distribution)({
    Manual: () => "manual" as const,
    Automatic: () => "automatic" as const,
    AtBlock: () => "at_block" as const,
    Interval: () => "interval" as const,
  });

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

  const fixedAmount = match(emission.allocation)({
    FixedAmount: (amount) => amount.toString(),
    Streams: () => null,
  });

  const emissionPermission: NewEmissionPermission = {
    permissionId: permissionId,
    allocationType,
    fixedAmount,
    distributionType,
    distributionThreshold,
    distributionTargetBlock,
    distributionIntervalBlocks,
    accumulating: emission.accumulating,
  };

  const streamAllocations: NewEmissionStreamAllocation[] = match(
    emission.allocation,
  )({
    Streams: (streams) =>
      Array.from(streams.entries()).map(([streamId, percentage]) => ({
        permissionId: permissionId,
        streamId: streamId,
        percentage: percentage, // 0-100, matches Substrate Percent type
      })),
    FixedAmount: () => [],
  });

  // Handle distribution targets (all emission permissions have targets)
  const distributionTargets: NewEmissionDistributionTarget[] = Array.from(
    emission.targets.entries(),
  ).map(([accountId, weight]) => ({
    permissionId: permissionId,
    targetAccountId: accountId,
    weight: Number(weight.toString()), // Convert bigint to number (u16 range: 0-65535)
  }));

  return {
    emissionPermission,
    streamAllocations,
    distributionTargets,
  };
}

/**
 * Transforms namespace permission data to database format
 */
function namespaceToDatabase(
  permissionId: PermissionId,
  namespace: NamespaceScope,
): {
  namespacePermission: NewNamespacePermission;
  namespacePaths: NewNamespacePermissionPath[];
} {
  const namespacePermission: NewNamespacePermission = {
    permissionId: permissionId,
  };

  // Extract namespace paths - each path becomes a separate database entry
  const namespacePaths: NewNamespacePermissionPath[] = namespace.paths.map(
    (pathSegments: string[]) => ({
      permissionId: permissionId,
      namespacePath: pathSegments.join("."), // Convert segments array to dot-separated string
    }),
  );

  return {
    namespacePermission,
    namespacePaths,
  };
}

/**
 * Transforms a blockchain permission contract to database format
 */
function permissionContractToDatabase(
  permissionId: PermissionId,
  contract: PermissionContract,
):
  | ({
      permission: NewPermission;
      hierarchy: NewPermissionHierarchy;
      enforcementControllers: NewPermissionEnforcementController[];
      revocationArbiters: NewPermissionRevocationArbiter[];
    } & (
      | {
          emissionPermission: NewEmissionPermission;
          streamAllocations: NewEmissionStreamAllocation[];
          distributionTargets: NewEmissionDistributionTarget[];
        }
      | {
          namespacePermission: NewNamespacePermission;
          namespacePaths: NewNamespacePermissionPath[];
        }
    ))
  | null {
  // Process emission and namespace permissions, skip curator permissions
  const shouldProcess = match(contract.scope)({
    Emission: () => true,
    Namespace: () => true,
    Curator: () => false,
  });

  if (!shouldProcess) {
    return null; // Skip curator permissions
  }

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
    RevocableByDelegator: () => "revocable_by_grantor" as const,
    RevocableByArbiters: () => "revocable_by_arbiters" as const,
    RevocableAfter: () => "revocable_after" as const,
  });

  const revocationBlockNumber = match(contract.revocation)({
    RevocableAfter: (block) => BigInt(block.toString()),
    Irrevocable: () => null,
    RevocableByDelegator: () => null,
    RevocableByArbiters: () => null,
  });

  const revocationRequiredVotes = match(contract.revocation)({
    RevocableByArbiters: (arbiters) =>
      BigInt(arbiters.requiredVotes.toString()),
    Irrevocable: () => null,
    RevocableByDelegator: () => null,
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
    grantorAccountId: contract.delegator,
    granteeAccountId: contract.recipient,
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
    None: (): NewPermissionHierarchy => ({
      childPermissionId: permissionId,
      parentPermissionId: permissionId, // Self-reference when no parent
    }),
  });

  // Initialize common arrays (always empty if not populated)
  let enforcementControllers: NewPermissionEnforcementController[] = [];
  let revocationArbiters: NewPermissionRevocationArbiter[] = [];

  // Handle enforcement authorities
  match(contract.enforcement)({
    ControlledBy: (controlled) => {
      enforcementControllers = controlled.controllers.map(
        (controller: SS58Address): NewPermissionEnforcementController => ({
          permissionId: permissionId,
          accountId: controller,
        }),
      );
    },
    None: () => {
      // enforcementControllers remains empty array
    },
  });

  // Handle revocation arbiters
  match(contract.revocation)({
    RevocableByArbiters: (arbiters) => {
      revocationArbiters = arbiters.accounts.map(
        (arbiter: SS58Address): NewPermissionRevocationArbiter => ({
          permissionId: permissionId,
          accountId: arbiter,
        }),
      );
    },
    Irrevocable: () => {
      // revocationArbiters remains empty array
    },
    RevocableByGrantor: () => {
      // revocationArbiters remains empty array
    },
    RevocableAfter: () => {
      // revocationArbiters remains empty array
    },
  });

  // Handle scope-specific data
  const emissionScope = EMISSION_SCOPE_SCHEMA.safeParse(contract.scope);
  let scopeSpecificData:
    | {
        emissionPermission: NewEmissionPermission;
        streamAllocations: NewEmissionStreamAllocation[];
        distributionTargets: NewEmissionDistributionTarget[];
      }
    | {
        namespacePermission: NewNamespacePermission;
        namespacePaths: NewNamespacePermissionPath[];
      };
  if (emissionScope.success) {
    scopeSpecificData = emissionToDatabase(permissionId, emissionScope.data);
  } else {
    const namespaceScope = NAMESPACE_SCOPE_SCHEMA.safeParse(contract.scope);
    // TODO: better discrimination between the scopes
    if (!namespaceScope.success) {
      throw new Error("Invalid scope");
    }
    scopeSpecificData = namespaceToDatabase(permissionId, namespaceScope.data);
  }
  return {
    permission,
    hierarchy,
    enforcementControllers,
    revocationArbiters,
    ...scopeSpecificData,
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
  const chainAgentsKeys = agents.map((agent) => checkSS58(agent.key));
  await cleanAgents(new Set(chainAgentsKeys), blockNumber);

  const timeDelta = new Date().getTime() - startTime.getTime();
  log.info(
    `Block ${blockNumber}: agent data synchronized in ${timeDelta / 1000} seconds`,
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

  log.info(`Block ${lastBlockNumber}: applications synchronized`);
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

  // Only upsert proposals that have changed
  const changedProposalsRes = await tryAsync(
    getProposals(lastBlock.apiAtBlock, isProposalToInsert),
  );
  if (log.ifResultIsErr(changedProposalsRes)) return;
  const [_changedProposalsError, changedProposalsResult] = changedProposalsRes;

  const changedProposalsMap = new Map(Object.entries(changedProposalsResult));
  const dbProposals: NewProposal[] = [];
  changedProposalsMap.forEach((value, _) => {
    dbProposals.push(agentProposalToProposal(value));
  });

  log.info(
    `Block ${lastBlockNumber}: upserting ${dbProposals.length} proposals`,
  );

  const upsertProposalRes = await tryAsync(upsertProposal(dbProposals));
  if (log.ifResultIsErr(upsertProposalRes)) return;

  log.info(`Block ${lastBlockNumber}: proposals synchronized`);
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
    log.error(
      `Block ${lastBlockNumber}: queryPermissions failed:`,
      permissionsMapErr,
    );
    return;
  }

  log.info(
    `Block ${lastBlockNumber}: found ${permissionsMap.size} permissions from blockchain`,
  );

  const permissionsData: ({
    permission: NewPermission;
    hierarchy: NewPermissionHierarchy;
    enforcementControllers: NewPermissionEnforcementController[];
    revocationArbiters: NewPermissionRevocationArbiter[];
  } & (
    | {
        emissionPermission: NewEmissionPermission;
        streamAllocations: NewEmissionStreamAllocation[];
        distributionTargets: NewEmissionDistributionTarget[];
      }
    | {
        namespacePermission: NewNamespacePermission;
        namespacePaths: NewNamespacePermissionPath[];
      }
  ))[] = [];

  // Transform each permission to database format
  for (const [permissionId, contract] of permissionsMap.entries()) {
    try {
      const permissionData = permissionContractToDatabase(
        permissionId,
        contract,
      );
      if (permissionData) {
        permissionsData.push(permissionData);
      }
    } catch (error) {
      log.error(`Failed to transform permission ${permissionId}:`, error);
      continue; // Skip this permission but continue with others
    }
  }

  log.info(
    `Block ${lastBlockNumber}: upserting ${permissionsData.length} permissions`,
  );

  // Clean up permissions that no longer exist on the blockchain
  await cleanPermissions(permissionsMap, lastBlockNumber);
  // Process permissions in batches of 50 to avoid timeout
  const BATCH_SIZE = 50;
  for (let i = 0; i < permissionsData.length; i += BATCH_SIZE) {
    const batch = permissionsData.slice(i, i + BATCH_SIZE);
    log.info(
      `Block ${lastBlockNumber}: processing permission batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(permissionsData.length / BATCH_SIZE)} (${batch.length} permissions)`,
    );

    const upsertPermissionsRes = await tryAsync(upsertPermissions(batch));
    if (log.ifResultIsErr(upsertPermissionsRes)) return;
  }

  log.info(`Block ${lastBlockNumber}: permissions synchronized`);
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
