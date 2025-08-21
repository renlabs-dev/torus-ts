import { match } from "rustie";

import type { Result } from "@torus-network/torus-utils/result";
import { makeErr, makeOk } from "@torus-network/torus-utils/result";

import type { SS58Address } from "../../types/address.js";
import type { NamespacePath } from "../../types/namespace/namespace-path.js";
import {
  queryAgentNamespacePermissions,
  queryPermission,
} from "../permission0/permission0-storage.js";
import type {
  PermissionContract,
  PermissionId,
  RevocationTerms,
} from "../permission0/permission0-types.js";
import { queryNamespaceEntriesOf } from "../torus0/torus0-storage.js";
import type { Api, SbQueryError } from "./fees.js";

/**
 * Utility function to compute the intersection of two sets
 */
function setIntersection<T>(setA: Set<T>, setB: Set<T>): Set<T> {
  const intersection = new Set<T>();
  for (const item of setA) {
    if (setB.has(item)) {
      intersection.add(item);
    }
  }
  return intersection;
}

/**
 * Node data structure for delegation tree graph visualization
 */
export interface DelegationNodeData extends Record<string, unknown> {
  id: string; // Dot-separated namespace path (e.g., "agent.dev01.arthur")
  label: string; // Last segment of the namespace path
  segments: NamespacePath; // Array of namespace segments
  accessible: boolean;
  permissions: Set<PermissionId | "self">; // Set of permissions that can delegate this namespace
}

/**
 * Edge structure for delegation tree
 */
export interface DelegationEdge {
  id: string;
  source: string;
  target: string;
}

/**
 * Result type for the delegation tree builder
 */
export interface DelegationTree {
  nodes: DelegationNodeData[];
  edges: DelegationEdge[];
}

/**
 * Centralized manager for delegation tree state and operations
 */
export class DelegationTreeManager {
  private nodes: Map<string, DelegationNodeData>;
  private parentChildMap: Map<string, Set<string>>;
  private childParentMap: Map<string, string>;
  private edges: DelegationEdge[];
  private permissionCounts: Map<PermissionId | "self", number | null>;

  private constructor() {
    this.nodes = new Map();
    this.parentChildMap = new Map();
    this.childParentMap = new Map();
    this.edges = [];
    this.permissionCounts = new Map();
  }

  /**
   * Helper function to query namespace entries for an address
   */
  private static async queryNamespaceEntriesForAddress(
    api: Api,
    address: SS58Address,
  ): Promise<Set<string> | null> {
    try {
      const namespaceEntries = await queryNamespaceEntriesOf(api, address);
      return new Set(namespaceEntries.map((entry) => entry.path.join(".")));
    } catch (error) {
      console.warn(
        `Failed to query delegator namespaces for ${address}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Helper function to process accessible namespaces and add them to the tree
   */
  private static processAccessibleNamespaces(
    accessibleNamespaces: string[],
    permissionId: PermissionId | "self",
    availableInstances: number | null,
    nodeMap: Map<string, DelegationNodeData>,
    permissionCounts: Map<PermissionId | "self", number | null>,
  ): void {
    // Store the available instance count in the central map
    // For permissions: availableInstances = maxInstances - sum(child.maxInstances)
    // For self-owned namespaces: null (infinite)
    permissionCounts.set(permissionId, availableInstances);

    for (const namespace of accessibleNamespaces) {
      const pathParts = namespace.split(".");
      const nodeId = namespace;
      const label = pathParts[pathParts.length - 1] ?? namespace;

      let node = nodeMap.get(nodeId);
      if (!node) {
        node = {
          id: nodeId,
          label,
          segments: pathParts as NamespacePath,
          accessible: true,
          permissions: new Set<PermissionId | "self">(),
        };
        nodeMap.set(nodeId, node);
      }

      // Add this permission to the node's permissions set
      node.permissions.add(permissionId);
    }
  }

  /**
   * Helper function to add prefix nodes and edges for a namespace path
   */
  private static addNamespaceHierarchy(
    namespacePath: string,
    nodeMap: Map<string, DelegationNodeData>,
    edgeSet: Set<string>,
    agentPermissions?: Map<PermissionId, PermissionContract>,
  ): void {
    const pathParts = namespacePath.split(".");

    // Add prefix nodes (skip generic "agent")
    for (let i = 2; i < pathParts.length; i++) {
      const prefixPath = pathParts.slice(0, i);
      const prefixNodeId = prefixPath.join(".");
      const prefixLabel =
        prefixPath[prefixPath.length - 1] ?? prefixPath.join(".");

      if (!nodeMap.has(prefixNodeId)) {
        // Check if this prefix is actually owned by the agent (only if agentPermissions provided)
        const isOwnedByAgent = agentPermissions
          ? Array.from(agentPermissions.values()).some((perm) => {
              if (!("Namespace" in perm.scope)) return false;
              return Array.from(perm.scope.Namespace.paths.values()).some(
                (pathsArray) =>
                  pathsArray.some(
                    (path) => path.join(".") === prefixPath.join("."),
                  ),
              );
            })
          : false;

        if (!isOwnedByAgent) {
          nodeMap.set(prefixNodeId, {
            id: prefixNodeId,
            label: prefixLabel,
            segments: prefixPath as NamespacePath,
            accessible: false,
            permissions: new Set<PermissionId | "self">(),
          });
        }
      }
    }

    // Add edges for hierarchy (skip generic "agent")
    for (let i = 2; i < pathParts.length; i++) {
      const parentParts = pathParts.slice(0, i);
      const childParts = pathParts.slice(0, i + 1);
      const parentId = parentParts.join(".");
      const childId = childParts.join(".");
      const edgeId = `${parentId}->${childId}`;

      if (!edgeSet.has(edgeId)) {
        edgeSet.add(edgeId);
      }
    }
  }

  /**
   * Create a new DelegationTreeManager by building the tree from blockchain data
   */
  static async create(
    api: Api,
    agentAddress: SS58Address,
  ): Promise<Result<DelegationTreeManager, SbQueryError | Error>> {
    const manager = new DelegationTreeManager();

    // Step 1: Get all namespace permissions where the agent is the recipient
    const [agentPermsError, agentPermissions] =
      await queryAgentNamespacePermissions(api, agentAddress);
    if (agentPermsError) return makeErr(agentPermsError);

    // Step 2: Get namespaces that we own directly
    const ownedNamespaces =
      (await DelegationTreeManager.queryNamespaceEntriesForAddress(
        api,
        agentAddress,
      )) ?? new Set<string>();

    // Step 3: Add our own owned namespaces first (with infinite redelegation capability)
    const nodeMap = new Map<string, DelegationNodeData>();
    const edgeSet = new Set<string>();
    const allNamespaces = new Set<string>();
    const permissionCounts = new Map<PermissionId | "self", number | null>();

    for (const ownedNamespace of ownedNamespaces) {
      DelegationTreeManager.processAccessibleNamespaces(
        [ownedNamespace], // Single namespace as array
        "self",
        null, // Infinite redelegations
        nodeMap,
        permissionCounts,
      );
      allNamespaces.add(ownedNamespace);
    }

    // Step 4: Process delegated permissions
    for (const [permissionId, permission] of agentPermissions) {
      if (!("Namespace" in permission.scope)) continue;

      const namespaceScope = permission.scope.Namespace;

      // Step 4: Process each entry in the paths map
      for (const [parentPermissionId, pathsArray] of namespaceScope.paths) {
        // Find the root owner by tracing back through parent permissions
        const rootOwnerResult = await match(parentPermissionId)({
          // If None, the delegator is the root owner
          None: () => Promise.resolve(makeOk(permission.delegator)),

          // Otherwise, trace back to find the root owner
          Some: async (permId: PermissionId) => {
            const currentPermId = permId;

            while (true) {
              const [error, parentPerm] = await queryPermission(
                api,
                currentPermId,
              );
              if (error !== undefined || parentPerm === null) {
                return makeErr(
                  `Failed to query parent permission ${currentPermId}`,
                );
              }

              if (!("Namespace" in parentPerm.scope)) {
                return makeErr(
                  `Parent permission ${currentPermId} is not a namespace permission`,
                );
              }

              // Check each entry in the parent's paths map

              for (const [grandParentId, paths] of parentPerm.scope.Namespace
                .paths) {
                const shouldReturn = match(grandParentId)({
                  None() {
                    // Found root - paths with None parent mean delegator owns them
                    return paths.length > 0;
                  },
                  Some(_id: PermissionId) {
                    return false;
                  },
                });

                if (shouldReturn) {
                  return makeOk(parentPerm.delegator);
                }
              }
              // No more parents found, current permission's delegator is root
              return makeOk(parentPerm.delegator);
            }
          },
        });

        const [rootError, rootOwnerAddress] = rootOwnerResult;
        if (rootError !== undefined) {
          console.warn(rootError);
          continue;
        }

        // Get the root owner's actual owned namespaces from torus0.namespaces
        const rootOwnerNamespaces =
          await DelegationTreeManager.queryNamespaceEntriesForAddress(
            api,
            rootOwnerAddress,
          );
        if (!rootOwnerNamespaces) continue;

        // Process the namespace paths for this parent
        for (const ownedPath of pathsArray) {
          const ownedNamespace = ownedPath.join(".");

          // Always include the delegated namespace itself
          const accessibleNamespaces = [ownedNamespace];

          // Find all downstream namespaces owned by the root owner
          const downstreamNamespaces = Array.from(rootOwnerNamespaces).filter(
            (ns) => ns.startsWith(ownedNamespace + "."),
          );

          // Add all downstream namespaces
          for (const downstream of downstreamNamespaces) {
            if (!accessibleNamespaces.includes(downstream)) {
              accessibleNamespaces.push(downstream);
            }
          }

          // Step 6: Calculate available instances using Substrate formula:
          // available_instances = max_instances - sum(child.max_instances for all children)
          let availableInstances = Number(permission.maxInstances);

          // Subtract max_instances of each child permission
          for (const childId of permission.children) {
            const [childError, childPermission] = await queryPermission(
              api,
              childId,
            );
            if (childError === undefined && childPermission !== null) {
              availableInstances -= Number(childPermission.maxInstances);
            }
            // If child not found or error, we treat it as 0 (saturating_sub behavior)
          }

          // Ensure we don't go negative (saturating behavior)
          availableInstances = Math.max(0, availableInstances);

          DelegationTreeManager.processAccessibleNamespaces(
            accessibleNamespaces,
            permissionId,
            availableInstances,
            nodeMap,
            permissionCounts,
          );

          // Collect all namespaces for hierarchy processing later
          for (const namespace of accessibleNamespaces) {
            allNamespaces.add(namespace);
          }
        }
      }
    }

    // Process all collected namespaces for hierarchy creation at the end
    for (const namespace of allNamespaces) {
      DelegationTreeManager.addNamespaceHierarchy(
        namespace,
        nodeMap,
        edgeSet,
        agentPermissions,
      );
    }

    // Initialize the manager with the built data
    manager.nodes = nodeMap;
    manager.permissionCounts = permissionCounts;
    manager.edges = Array.from(edgeSet).map((edgeId) => {
      const parts = edgeId.split("->");
      const source = parts[0];
      const target = parts[1];

      if (source === undefined || target === undefined) {
        console.warn(`Invalid edge ID format: ${edgeId}`);
        throw new Error(
          `Edge ID must be in format "source->target", got: ${edgeId}`,
        );
      }

      return {
        id: edgeId,
        source,
        target,
      };
    });

    // Build parent-child relationships
    for (const edge of manager.edges) {
      if (!manager.parentChildMap.has(edge.source)) {
        manager.parentChildMap.set(edge.source, new Set());
      }
      const childrenSet = manager.parentChildMap.get(edge.source);
      if (childrenSet === undefined) {
        console.warn(
          `Parent-child map inconsistency for source: ${edge.source}`,
        );
        throw new Error(
          `Expected children set to exist for source: ${edge.source}`,
        );
      }
      childrenSet.add(edge.target);
      manager.childParentMap.set(edge.target, edge.source);
    }

    return makeOk(manager);
  }

  /**
   * Update the available instance count for a specific permission globally
   * Note: This updates the calculated available instances (maxInstances - sum(child.maxInstances)),
   * not the raw maxInstances value from the blockchain.
   *
   * @param permissionId The permission to update
   * @param newCount The new available instance count to set
   * @returns The actual value that was set, null if self-owned (infinite)
   */
  updatePermissionCount(
    permissionId: PermissionId | "self",
    newCount: number | null,
  ): number | null {
    // Self-owned permissions can't be updated
    if (permissionId === "self") {
      return null; // Return null to indicate infinite/unchanged
    }

    // Update the permission's available instance count in the central map
    this.permissionCounts.set(permissionId, newCount);

    return newCount;
  }

  /**
   * Get all nodes as an array
   */
  getNodes(): DelegationNodeData[] {
    return Array.from(this.nodes.values());
  }

  /**
   * Get all edges as an array
   */
  getEdges(): DelegationEdge[] {
    return this.edges;
  }

  /**
   * Get a specific node by ID
   */
  getNode(nodeId: string): DelegationNodeData | undefined {
    return this.nodes.get(nodeId);
  }

  /**
   * Get all permissions and their available redelegation instances for a node
   * Returns a map of permissionId -> availableInstances (maxInstances - sum(child.maxInstances))
   */
  getNodePermissions(
    nodeId: string,
  ): Map<PermissionId | "self", number | null> {
    const node = this.nodes.get(nodeId);
    if (!node) return new Map();

    // Build a map from the node's permissions set using the central counts
    const result = new Map<PermissionId | "self", number | null>();
    for (const permissionId of node.permissions) {
      const count = this.permissionCounts.get(permissionId);
      if (count !== undefined) {
        result.set(permissionId, count);
      }
    }
    return result;
  }

  /**
   * Get all permissions and their available instance counts
   * Returns a map of permissionId -> availableInstances (maxInstances - sum(child.maxInstances))
   */
  getAllPermissionCounts(): Map<PermissionId | "self", number | null> {
    return new Map(this.permissionCounts);
  }

  /**
   * Get the permission with the most instances for a given namespace
   * Returns the permissionId and count, or null if no permissions available
   *
   * @param namespacePath - The namespace path (e.g., "agent.arthur.doyle.run")
   * @returns Object with permissionId and count, or null if none found
   */
  getPermissionWithMostInstances(
    namespacePath: string,
  ): { permissionId: PermissionId | "self"; count: number | null } | null {
    const nodeId = namespacePath;
    const node = this.nodes.get(nodeId);

    if (!node || node.permissions.size === 0) {
      return null;
    }

    let bestPermission: PermissionId | "self" | null = null;
    let bestCount: number | null = null;

    for (const permissionId of node.permissions) {
      const count = this.permissionCounts.get(permissionId);
      if (count === undefined) continue;

      // If we find a permission with infinite instances (null), return it immediately
      if (count === null) {
        return { permissionId, count: null };
      }

      // Otherwise, track the highest count
      if (bestCount === null || count > bestCount) {
        bestPermission = permissionId;
        bestCount = count;
      }
    }

    if (bestPermission === null) {
      return null;
    }

    return { permissionId: bestPermission, count: bestCount };
  }

  /**
   * Get the intersection of permissions across multiple namespace paths
   * Returns permissions that are common to ALL provided namespaces
   *
   * @param namespacePaths - Array of namespace paths to find common permissions
   * @returns Set of permission IDs that exist in all namespaces
   */
  getPermissionIntersection(
    namespacePaths: string[],
  ): Set<PermissionId | "self"> {
    if (namespacePaths.length === 0) {
      return new Set();
    }

    // Map namespace paths to their permission sets
    const permissionSets = namespacePaths.map((path) => {
      const nodeId = path;
      const node = this.nodes.get(nodeId);
      return node ? node.permissions : new Set<PermissionId | "self">();
    });

    // Use reduce to find intersection of all sets
    return permissionSets.reduce((acc, curr) => setIntersection(acc, curr));
  }

  /**
   * Get all children of a node
   */
  getChildren(nodeId: string): string[] {
    const children = this.parentChildMap.get(nodeId);
    return children ? Array.from(children) : [];
  }

  /**
   * Get the parent of a node
   */
  getParent(nodeId: string): string | undefined {
    return this.childParentMap.get(nodeId);
  }

  /**
   * Get all nodes that can delegate to a target namespace
   *
   * @param targetNamespace - The namespace to delegate
   * @returns Array of nodes that have permissions to delegate to this namespace
   */
  getNodesWithPermissionsFor(targetNamespace: string): DelegationNodeData[] {
    const targetNodeId = targetNamespace;

    const candidates: DelegationNodeData[] = [];

    for (const node of this.nodes.values()) {
      // Skip non-accessible nodes
      if (!node.accessible) continue;

      // Check if this node has any permissions with available instances
      let hasAvailableInstances = false;
      for (const permissionId of node.permissions) {
        const count = this.permissionCounts.get(permissionId);
        if (count === null || (count !== undefined && count > 0)) {
          hasAvailableInstances = true;
          break;
        }
      }
      if (!hasAvailableInstances) continue;

      // Check if the target is this node or a descendant of this node
      if (targetNodeId === node.id || targetNodeId.startsWith(node.id + "-")) {
        candidates.push(node);
      }
    }

    return candidates;
  }

  /**
   * Convert to the legacy DelegationTree format for compatibility
   */
  toDelegationTree(): DelegationTree {
    return {
      nodes: this.getNodes(),
      edges: this.getEdges(),
    };
  }

  /**
   * Checks if the child revocation terms are weaker than or equal to the parent.
   *
   * This implements the same hierarchy validation as the Substrate runtime,
   * ensuring that delegated permissions cannot have stronger revocation terms
   * than their parent permissions.
   *
   * Hierarchy from weakest to strongest:
   * 1. RevocableByDelegator (weakest) - Can be revoked by delegator anytime
   * 2. RevocableAfter(block) - Can only be revoked after specific block
   * 3. RevocableByArbiters - Requires arbiter votes for revocation
   * 4. Irrevocable (strongest) - Cannot be revoked
   *
   * @param parent - The parent permission's revocation terms
   * @param child - The child permission's revocation terms to validate
   * @returns True if child terms are weaker than or equal to parent terms
   *
   * @example
   * ```ts
   * // Valid delegations (child is weaker)
   * DelegationTreeManager.isWeaker(
   *   { Irrevocable: null },
   *   { RevocableByDelegator: null }
   * ); // true
   *
   * DelegationTreeManager.isWeaker(
   *   { RevocableAfter: 1000n },
   *   { RevocableAfter: 1200n }
   * ); // true (child block >= parent block)
   *
   * // Invalid delegations (child is stronger)
   * DelegationTreeManager.isWeaker(
   *   { RevocableByDelegator: null },
   *   { Irrevocable: null }
   * ); // false
   * ```
   */
  static isWeaker(parent: RevocationTerms, child: RevocationTerms): boolean {
    // RevocableByDelegator is always the weakest - can be child of any parent
    return match(child)({
      RevocableByDelegator() {
        return true;
      },
      RevocableAfter(childBlock) {
        return match(parent)({
          RevocableAfter(parentBlock) {
            return parentBlock <= childBlock;
          },
          Irrevocable() {
            return true;
          },
          RevocableByDelegator() {
            return false;
          },
          RevocableByArbiters() {
            return false;
          },
        });
      },
      Irrevocable() {
        return match(parent)({
          Irrevocable() {
            return true;
          },
          RevocableAfter() {
            return false;
          },
          RevocableByDelegator() {
            return false;
          },
          RevocableByArbiters() {
            return false;
          },
        });
      },
      RevocableByArbiters() {
        return match(parent)({
          Irrevocable() {
            return true;
          },
          RevocableByArbiters() {
            return true;
          },
          RevocableAfter() {
            return false;
          },
          RevocableByDelegator() {
            return false;
          },
        });
      },
    });
  }
}

/**
 * Utility function to get the parent node ID for a given node ID
 */
export function getParentNodeId(nodeId: string): string | null {
  const parts = nodeId.split(".");
  if (parts.length <= 1) return null;
  return parts.slice(0, -1).join(".");
}

/**
 * Utility function to get all child node IDs for a given node ID
 */
export function getChildNodeIds(
  nodeId: string,
  allNodes: DelegationNodeData[],
): string[] {
  const targetPrefix = nodeId + ".";
  return allNodes
    .map((node) => node.id)
    .filter(
      (id) =>
        id.startsWith(targetPrefix) &&
        id.split(".").length === nodeId.split(".").length + 1,
    );
}
