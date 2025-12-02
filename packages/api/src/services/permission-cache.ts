import type { ApiPromise } from "@polkadot/api";
import {
  queryAgents,
  queryDelegatorNamespacePermissions,
} from "@torus-network/sdk/chain";
import type { SS58Address } from "@torus-network/sdk/types";
import { validateNamespacePath } from "@torus-network/sdk/types";
import { BasicLogger } from "@torus-network/torus-utils/logger";
import { assert } from "tsafe";

export class PermissionDeniedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PermissionDeniedError";
  }
}

export class PermissionCacheNotInitializedError extends Error {
  constructor() {
    super("Permission cache not initialized");
    this.name = "PermissionCacheNotInitializedError";
  }
}

const logger = BasicLogger.create({
  name: "torus-api.services.permission-cache",
});

/**
 * In-memory cache for namespace permissions with periodic blockchain refresh.
 *
 * Caches namespace permission data to avoid expensive blockchain queries on every
 * request. Supports cascading permission checks where parent namespaces grant
 * access to child namespaces (e.g., "prediction" grants access to "prediction.filter").
 *
 * Only caches permissions granted by a specific grantor address.
 *
 * Uses the same cascading logic as the Agent class from torus-sdk-ts.
 *
 * @example
 * ```ts
 * const cache = new PermissionCacheService(api, grantorAddress, 300000);
 * await cache.initialize();
 *
 * // Check if agent has permission granted by our grantor
 * cache.checkPermission(agentAddress, "prediction.filter");
 *
 * // Cleanup when done
 * cache.stop();
 * ```
 */
export class PermissionCacheService {
  /**
   * Cache structure: namespace path (lowercase) → array of grantee addresses
   * Example: "agent.gumball.prediction.filter" → ["5GrwvaEF...", "5FHneW46..."]
   *
   * Only includes permissions granted by the specified grantor.
   */
  private cache = new Map<string, SS58Address[]>();

  /**
   * The grantor's agent name (e.g., "gumball")
   * Used to build full namespace paths when checking permissions
   */
  private grantorAgentName: string | null = null;

  private refreshIntervalId: NodeJS.Timeout | null = null;
  private isInitialized = false;

  /**
   * @param wsAPI - Promise that resolves to blockchain API connection
   * @param grantorAddress - Only cache permissions granted by this address
   * @param refreshIntervalMs - How often to refresh cache from blockchain (default: 5 minutes)
   */
  constructor(
    private readonly wsAPI: Promise<ApiPromise>,
    private readonly grantorAddress: SS58Address,
    private readonly refreshIntervalMs: number = 300000,
  ) {}

  /**
   * Initializes the cache by loading permissions from the blockchain
   * and starting the periodic refresh.
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      logger.warn("Permission cache already initialized, skipping");
      return;
    }

    logger.info("Initializing permission cache...");

    // Resolve grantor's agent name first
    await this.resolveGrantorAgentName();

    await this.loadPermissions();
    this.startPeriodicRefresh();
    this.isInitialized = true;
    logger.info("Permission cache initialized successfully");
  }

  /**
   * Resolves the grantor's agent name from the blockchain.
   */
  private async resolveGrantorAgentName(): Promise<void> {
    const api = await this.wsAPI;

    // queryAgents throws on error, doesn't use Result pattern
    const agentsMap = await queryAgents(api);

    const grantorAgent = agentsMap.get(this.grantorAddress);
    if (!grantorAgent) {
      throw new Error(
        `Grantor agent not found on-chain: ${this.grantorAddress}`,
      );
    }

    this.grantorAgentName = grantorAgent.name.toLowerCase();
    logger.info(
      `Resolved grantor agent name: "${this.grantorAgentName}" for address ${this.grantorAddress}`,
    );
  }

  /**
   * Loads namespace permissions from the blockchain and populates the cache.
   *
   * Only loads permissions granted by the configured grantor address.
   * Handles errors gracefully - on failure, maintains the existing cache
   * to maximize availability even with stale data.
   */
  async loadPermissions(): Promise<void> {
    const api = await this.wsAPI;

    const [error, permissionsMap] = await queryDelegatorNamespacePermissions(
      api,
      this.grantorAddress,
    );

    if (error !== undefined) {
      logger.error(
        `Failed to query namespace permissions for delegator ${this.grantorAddress}:`,
        error,
      );
      // Keep existing cache on error to maintain availability
      return;
    }

    // Build new cache structure
    const newCache = new Map<string, SS58Address[]>();

    for (const [_permissionId, permission] of permissionsMap) {
      // Extract namespace scope data (already filtered to namespace permissions)
      if (!("Namespace" in permission.scope)) {
        continue;
      }

      const namespaceScope = permission.scope.Namespace;
      const recipient = namespaceScope.recipient;

      // Process all paths in this permission
      // paths is a Map<Option<PermissionId>, NamespacePath[]>
      // NamespacePath is a branded string[] type (array of segments)
      for (const [_parentPermissionId, pathsArray] of namespaceScope.paths) {
        for (const path of pathsArray) {
          // path is NamespacePath (string[]) like ["prediction", "filter"]
          // Join segments with "." and normalize to lowercase for case-insensitive matching
          const normalizedPath = path.join(".").toLowerCase();

          // Get or create array of addresses for this path
          let addresses = newCache.get(normalizedPath);
          if (addresses === undefined) {
            addresses = [];
            newCache.set(normalizedPath, addresses);
          }

          addresses.push(recipient);
        }
      }
    }

    // Replace cache atomically
    this.cache = newCache;

    logger.info(
      `Loaded ${newCache.size} unique namespace paths with ${permissionsMap.size} permissions granted by ${this.grantorAddress}`,
    );

    // Debug: Print all cached permissions
    logger.info("=== Permission Cache Contents ===");
    for (const [path, addresses] of newCache.entries()) {
      logger.info(`  Path: "${path}" → Grantees: [${addresses.join(", ")}]`);
    }
    logger.info("=================================");
  }

  /**
   * Starts periodic refresh of the permission cache.
   */
  private startPeriodicRefresh(): void {
    assert(this.refreshIntervalId === null, "Periodic refresh already started");

    this.refreshIntervalId = setInterval(() => {
      logger.debug("Refreshing permission cache...");
      this.loadPermissions().catch((error) => {
        logger.error("Error during periodic permission cache refresh:", error);
      });
    }, this.refreshIntervalMs);

    logger.info(
      `Started periodic refresh every ${this.refreshIntervalMs}ms (${this.refreshIntervalMs / 1000}s)`,
    );
  }

  /**
   * Checks if an address has permission for a namespace path with cascading logic.
   *
   * Automatically prepends the grantor's agent prefix to the requested path.
   * For example, if grantor is "gumball" and you check for "prediction.filter",
   * it will check for "agent.gumball.prediction.filter" on-chain.
   *
   * Implements cascading permission algorithm:
   * - Parent namespace permissions grant access to all child namespaces
   * - "agent.gumball.prediction" grants access to "agent.gumball.prediction.filter"
   *
   * @param userAddress - SS58 address to check
   * @param namespacePath - Agent-agnostic namespace path (e.g., "prediction.filter")
   * @returns true if permission exists, false otherwise
   */
  hasPermission(userAddress: SS58Address, namespacePath: string): boolean {
    assert(
      this.grantorAgentName !== null,
      "Grantor agent name must be resolved before checking permissions",
    );

    // Build full path: agent.<grantorName>.<requestedPath>
    const fullPath = `agent.${this.grantorAgentName}.${namespacePath}`;
    const normalizedPath = fullPath.toLowerCase();

    // Validate and parse the requested namespace path into segments
    const [error, requestedSegments] = validateNamespacePath(normalizedPath);
    if (error !== undefined) {
      logger.error(`Invalid namespace path: ${error}`);
      return false;
    }

    // Check each granted permission to see if it's a parent of the requested path
    for (const [grantedPath, grantees] of this.cache) {
      if (!grantees.includes(userAddress)) continue;

      // Parse the granted path into segments
      const [grantedError, grantedSegments] =
        validateNamespacePath(grantedPath);
      if (grantedError !== undefined) {
        logger.error(`Invalid granted namespace path: ${grantedError}`);
        continue;
      }

      // Check if granted path is a parent of (or equal to) the requested path
      // All segments of the granted path must match the start of the requested path
      if (grantedSegments.length <= requestedSegments.length) {
        const isParentPath = grantedSegments.every(
          (segment: string, index: number) =>
            segment === requestedSegments[index],
        );

        if (isParentPath) {
          if (grantedSegments.length === requestedSegments.length) {
            logger.debug(
              `User ${userAddress} has exact permission for ${normalizedPath}`,
            );
          } else {
            logger.debug(
              `User ${userAddress} has cascading permission for ${normalizedPath} via granted path ${grantedPath}`,
            );
          }
          return true;
        }
      }
    }

    logger.debug(
      `User ${userAddress} does not have permission for namespace ${normalizedPath}`,
    );
    return false;
  }

  /**
   * Checks if an address has permission, throwing an error if not.
   *
   * @param address - SS58 address to check
   * @param namespacePath - Namespace path required
   * @throws PermissionDeniedError if permission is missing
   * @throws PermissionCacheNotInitializedError if cache not initialized
   */
  checkPermission(address: SS58Address, namespacePath: string): void {
    if (!this.isInitialized) {
      logger.error("Permission check attempted before cache initialization");
      throw new PermissionCacheNotInitializedError();
    }

    if (!this.hasPermission(address, namespacePath)) {
      logger.warn(
        `Permission denied: ${address} does not have ${namespacePath}`,
      );
      throw new PermissionDeniedError(
        `Permission denied: requires ${namespacePath}`,
      );
    }

    logger.debug(`Permission granted: ${address} has ${namespacePath}`);
  }

  /**
   * Stops the periodic refresh and cleans up resources.
   */
  stop(): void {
    if (this.refreshIntervalId !== null) {
      clearInterval(this.refreshIntervalId);
      this.refreshIntervalId = null;
      logger.info("Stopped periodic permission cache refresh");
    }
  }

  /**
   * Gets cache statistics for debugging/monitoring.
   */
  getStats(): {
    uniquePaths: number;
    totalAddresses: number;
    isInitialized: boolean;
  } {
    let totalAddresses = 0;
    for (const addresses of this.cache.values()) {
      totalAddresses += addresses.length;
    }

    return {
      uniquePaths: this.cache.size,
      totalAddresses,
      isInitialized: this.isInitialized,
    };
  }
}

// Singleton instance (lazy initialization)
let cacheInstance: PermissionCacheService | null = null;
let initPromise: Promise<void> | null = null;

/**
 * Gets or creates the global permission cache instance.
 *
 * Initializes the cache lazily on first access.
 *
 * @param wsAPI - Blockchain API connection
 * @param grantorAddress - Only cache permissions granted by this address
 * @param refreshIntervalMs - Cache refresh interval (default: 5 minutes)
 * @returns The singleton cache instance
 */
export function getPermissionCache(
  wsAPI: Promise<ApiPromise>,
  grantorAddress: SS58Address,
  refreshIntervalMs?: number,
): PermissionCacheService {
  if (cacheInstance === null) {
    cacheInstance = new PermissionCacheService(
      wsAPI,
      grantorAddress,
      refreshIntervalMs,
    );

    // Start lazy initialization (don't await - let it run in background)
    if (initPromise === null) {
      initPromise = cacheInstance.initialize().catch((error) => {
        logger.error("Failed to initialize permission cache:", error);
      });
    }
  }
  return cacheInstance;
}
