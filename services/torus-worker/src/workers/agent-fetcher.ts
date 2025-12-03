import type {
  AccumulatedStreamEntry,
  LastBlock,
  NamespaceScope,
  PermissionContract,
  PermissionId,
  Proposal,
  StreamId,
  StreamScope,
} from "@torus-network/sdk/chain";
import {
  queryAgents,
  queryAllAccumulatedStreamAmounts,
  queryLastBlock,
  queryPermissions,
  queryWhitelist,
} from "@torus-network/sdk/chain";
import { CONSTANTS } from "@torus-network/sdk/constants";
import type { SS58Address } from "@torus-network/sdk/types";
import { checkSS58 } from "@torus-network/sdk/types";
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
import type {
  NewAccumulatedStreamAmount,
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
  upsertAccumulatedStreamAmounts,
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
 * Transforms stream permission data to database format (formerly emission)
 */
function streamToDatabase(
  permissionId: PermissionId,
  stream: StreamScope,
  delegator: SS58Address,
  streamAccumulations: AccumulatedStreamEntry[],
  atBlock: number,
): {
  emissionPermission: NewEmissionPermission;
  streamAllocations: NewEmissionStreamAllocation[];
  distributionTargets: NewEmissionDistributionTarget[];
} {
  const allocationType = match(stream.allocation)({
    Streams: () => "streams" as const,
    FixedAmount: () => "fixed_amount" as const,
  });

  const distributionType = match(stream.distribution)({
    Manual: () => "manual" as const,
    Automatic: () => "automatic" as const,
    AtBlock: () => "at_block" as const,
    Interval: () => "interval" as const,
  });

  const distributionThreshold = match(stream.distribution)({
    Automatic: (auto) => auto.toString(),
    Manual: () => null,
    AtBlock: () => null,
    Interval: () => null,
  });

  const distributionTargetBlock = match(stream.distribution)({
    AtBlock: (atBlock) => BigInt(atBlock.toString()),
    Manual: () => null,
    Automatic: () => null,
    Interval: () => null,
  });

  const distributionIntervalBlocks = match(stream.distribution)({
    Interval: (interval) => BigInt(interval.toString()),
    Manual: () => null,
    Automatic: () => null,
    AtBlock: () => null,
  });

  const fixedAmount = match(stream.allocation)({
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
    accumulating: stream.accumulating,
    weightSetter: [delegator],
    recipientManager: [delegator],
  };

  const streamAllocations: NewEmissionStreamAllocation[] = match(
    stream.allocation,
  )({
    Streams: (streams: Map<StreamId, number>) =>
      Array.from(streams.entries()).map(([streamId, percentage]) => ({
        permissionId: permissionId,
        streamId: streamId,
        percentage: percentage, // 0-100, matches Substrate Percent type
      })),
    FixedAmount: () => [],
  });

  // Handle distribution targets (create entry for each stream-target combination)
  const distributionTargets: NewEmissionDistributionTarget[] = [];

  // Create a lookup map for accumulated amounts by (delegator, streamId, permissionId)
  // The delegator is the account that owns/delegates the stream and where tokens accumulate
  const accumulationLookup = new Map<string, bigint>();
  for (const accumulation of streamAccumulations) {
    const key = `${accumulation.delegator}-${accumulation.streamId}-${accumulation.permissionId}`;
    accumulationLookup.set(key, accumulation.amount);
  }

  // Calculate total weight for proportional distribution
  // Note: With the new multi-recipient structure, this logic may need updates
  const totalWeight = Array.from(stream.recipients.values()).reduce(
    (sum, weight) => sum + weight,
    BigInt(0),
  );

  for (const [accountId, weight] of stream.recipients.entries()) {
    for (const streamAllocation of streamAllocations) {
      // Look up accumulated amount for this permission's delegator (the account that owns/delegates the stream)
      // The accumulated amount is stored under (delegator, streamId, permissionId)
      const lookupKey = `${delegator}-${streamAllocation.streamId}-${permissionId}`;
      const totalAccumulatedForStream =
        accumulationLookup.get(lookupKey) ?? BigInt(0);

      // Distribute the accumulated amount proportionally based on target weights
      // accumulatedTokens = (weight / totalWeight) * totalAccumulatedForStream
      const accumulatedTokens =
        totalWeight > BigInt(0)
          ? (weight * totalAccumulatedForStream) / totalWeight
          : BigInt(0);

      distributionTargets.push({
        permissionId: permissionId,
        streamId: streamAllocation.streamId,
        targetAccountId: accountId,
        weight: Number(weight.toString()), // Convert bigint to number (u16 range: 0-65535)
        accumulatedTokens: accumulatedTokens.toString(),
        atBlock: atBlock,
      });
    }
  }

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
    recipient: namespace.recipient,
    maxInstances: namespace.maxInstances,
  };

  // Extract namespace paths from the map structure
  // namespace.paths is a Map<Option<PermissionId>, Array<string>>
  const namespacePaths: NewNamespacePermissionPath[] = [];

  for (const [_parentPermissionId, pathsArray] of namespace.paths.entries()) {
    for (const pathSegments of pathsArray) {
      namespacePaths.push({
        permissionId: permissionId,
        namespacePath: pathSegments.join("."), // Convert NamespacePath (string[]) to dot-separated string
      });
    }
  }

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
  streamAccumulations: AccumulatedStreamEntry[],
  atBlock: number,
):
  | ({
      permission: NewPermission;
      hierarchies: NewPermissionHierarchy[];
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
  // Process stream and namespace permissions, skip curator permissions
  const shouldProcess = match(contract.scope)({
    Stream: () => true,
    Namespace: () => true,
    Curator: () => false,
    Wallet: () => false,
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
    RevocableByDelegator: () => "revocable_by_delegator" as const,
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
    granteeAccountId: null, // No longer using grantee field - recipients are now in weightSetter/recipientManager arrays
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

  // Handle hierarchy - create parent-child relationships based on scope's children field
  const hierarchy: NewPermissionHierarchy[] = [];

  // Extract children from the scope
  const children = match(contract.scope)({
    Stream: () => [], // Stream scopes don't have children
    Namespace: (scope) => scope.children,
    Curator: (scope) => scope.children,
    Wallet: () => [], // Wallet scopes don't have children
  });

  // Create hierarchy entries for each child permission
  for (const childPermissionId of children) {
    hierarchy.push({
      childPermissionId: childPermissionId,
      parentPermissionId: permissionId,
    });
  }

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
    RevocableByDelegator: () => {
      // revocationArbiters remains empty array
    },
    RevocableAfter: () => {
      // revocationArbiters remains empty array
    },
  });

  // Handle scope-specific data
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

  // TODO: MAKE THIS PRETTIER
  if ("Stream" in contract.scope) {
    scopeSpecificData = streamToDatabase(
      permissionId,
      contract.scope.Stream,
      contract.delegator,
      streamAccumulations,
      atBlock,
    );
  } else if ("Namespace" in contract.scope) {
    scopeSpecificData = namespaceToDatabase(
      permissionId,
      contract.scope.Namespace,
    );
  } else {
    // This should never happen due to shouldProcess check above
    throw new Error(`Unexpected scope type in permission ${permissionId}`);
  }

  return {
    permission,
    hierarchies: hierarchy,
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
async function runApplicationsFetch(lastBlock: LastBlock) {
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
async function runProposalsFetch(lastBlock: LastBlock) {
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
async function runPermissionsFetch(lastBlock: LastBlock) {
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

  // Query all accumulated stream amounts
  const streamAccumulationsResult = await queryAllAccumulatedStreamAmounts(
    lastBlock.apiAtBlock,
  );
  const [streamAccumulationsErr, streamAccumulations] =
    streamAccumulationsResult;
  if (streamAccumulationsErr) {
    log.error(
      `Block ${lastBlockNumber}: queryAllAccumulatedStreamAmounts failed:`,
      streamAccumulationsErr,
    );
    return;
  }

  log.info(
    `Block ${lastBlockNumber}: found ${streamAccumulations.length} accumulated stream amounts`,
  );

  const permissionsData: ({
    permission: NewPermission;
    hierarchies: NewPermissionHierarchy[];
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
        streamAccumulations,
        lastBlockNumber,
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

  const upsertPermissionsRes = await tryAsync(
    upsertPermissions(permissionsData),
  );
  if (log.ifResultIsErr(upsertPermissionsRes)) return;

  log.info(`Block ${lastBlockNumber}: permissions synchronized`);
}

/**
 * Updates accumulated stream amounts every 100 blocks.
 * This queries all accumulated amounts once and filters locally for efficiency.
 *
 * @param lastBlock - Contains blockchain API instance frozen at a specific block height
 */
async function runStreamAccumulationUpdate(lastBlock: LastBlock) {
  const lastBlockNumber = lastBlock.blockNumber;
  log.info(`Block ${lastBlockNumber}: running stream accumulation update`);

  // First query all permissions to have the context available
  const permissionsQueryResult = await queryPermissions(lastBlock.apiAtBlock);
  const [permissionsMapErr, permissionsMap] = permissionsQueryResult;
  if (permissionsMapErr) {
    log.error(
      `Block ${lastBlockNumber}: queryPermissions failed:`,
      permissionsMapErr,
    );
    return;
  }

  // Query all accumulated stream amounts from storage
  const streamAccumulationsResult = await queryAllAccumulatedStreamAmounts(
    lastBlock.apiAtBlock,
  );
  const [streamAccumulationsErr, streamAccumulations] =
    streamAccumulationsResult;

  if (streamAccumulationsErr) {
    log.error(
      `Block ${lastBlockNumber}: queryAllAccumulatedStreamAmounts failed:`,
      streamAccumulationsErr,
    );
    return;
  }

  log.info(
    `Block ${lastBlockNumber}: found ${streamAccumulations.length} accumulated stream amounts`,
  );

  // Transform accumulated stream amounts to database format with permission context
  const dbStreamAmounts: NewAccumulatedStreamAmount[] = [];

  log.info(
    `Block ${lastBlockNumber}: processing ${streamAccumulations.length} stream accumulations`,
  );

  for (const accumulation of streamAccumulations) {
    const permission = permissionsMap.get(accumulation.permissionId);

    if (!permission) {
      log.warn(
        `Permission ${accumulation.permissionId} not found for stream accumulation`,
      );
      continue;
    }

    const streamAmount = {
      grantorAccountId: accumulation.delegator,
      streamId: accumulation.streamId,
      permissionId: accumulation.permissionId,
      accumulatedAmount: accumulation.amount.toString(),
      lastExecutedBlock: match(permission.lastExecution)({
        Some: (block) => block,
        None: () => null,
      }),
      atBlock: lastBlockNumber,
      executionCount: Number(permission.executionCount),
    };

    dbStreamAmounts.push(streamAmount);
  }

  if (dbStreamAmounts.length > 0) {
    log.info(
      `Block ${lastBlockNumber}: upserting ${dbStreamAmounts.length} accumulated stream amounts`,
    );

    const upsertRes = await tryAsync(
      upsertAccumulatedStreamAmounts(dbStreamAmounts),
    );

    if (log.ifResultIsErr(upsertRes)) {
      log.error(
        `Block ${lastBlockNumber}: failed to upsert stream amounts:`,
        upsertRes[0],
      );
      return;
    }

    log.info(`Block ${lastBlockNumber}: stream accumulations synchronized`);
  } else {
    log.info(`Block ${lastBlockNumber}: no stream amounts to upsert`);
  }
}

/**
 * Blockchain data synchronization in an infinite loop.
 * Processes each new block once, skips already processed blocks, and handles
 * all errors internally to ensure the synchronization process never terminates.
 *
 * @param props - Contains API connection and state for tracking the last processed block
 */
export async function agentFetcherWorker(props: WorkerProps) {
  let _lastStreamAccumulationBlock = 0;

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
        await runStreamAccumulationUpdate(lastBlock);
        _lastStreamAccumulationBlock = lastBlockNumber;
      })(),
    );
    if (log.ifResultIsErr(fetchWorkerRes)) {
      log.error("Agent fetcher failed:", fetchWorkerRes[0]);
      await sleep(retryDelay);
    }

    await sleep(retryDelay);
  }
}
