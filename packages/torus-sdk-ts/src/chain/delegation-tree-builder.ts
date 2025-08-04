import type { Result } from "@torus-network/torus-utils/result";
import { makeErr, makeOk } from "@torus-network/torus-utils/result";

import type { SS58Address } from "../types/address.js";
import type { Api, SbQueryError } from "./common/index.js";
import type { PermissionContract, PermissionId } from "./permission0.js";
import { queryAgentNamespacePermissions } from "./permission0.js";
import { queryNamespaceEntriesOf } from "./torus0/namespace.js";

/**
 * Node data structure for delegation tree graph visualization
 */
export interface DelegationNodeData extends Record<string, unknown> {
  id: string;
  label: string;
  accessible: boolean;
  redelegationCount: Map<string, number | null>; // parentNodeId -> count (null = infinite)
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
  private ownedNamespaces: Set<string>;

  private constructor() {
    this.nodes = new Map();
    this.parentChildMap = new Map();
    this.childParentMap = new Map();
    this.edges = [];
    this.ownedNamespaces = new Set();
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
    ownedNamespace: string,
    maxInstances: number | null,
    nodeMap: Map<string, DelegationNodeData>,
  ): void {
    for (const namespace of accessibleNamespaces) {
      const pathParts = namespace.split(".");
      const nodeId = pathParts.join("-");
      const label = pathParts[pathParts.length - 1] ?? namespace;

      if (!nodeMap.has(nodeId)) {
        const redelegationCount = new Map<string, number | null>();

        // The owned namespace is what grants redelegation capability
        const ownedNodeId = ownedNamespace.replace(/\./g, "-");
        redelegationCount.set(ownedNodeId, maxInstances);

        nodeMap.set(nodeId, {
          id: nodeId,
          label,
          accessible: true,
          redelegationCount,
        });
      }
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
      const prefixNodeId = prefixPath.join("-");
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
            accessible: false,
            redelegationCount: new Map(),
          });
        }
      }
    }

    // Add edges for hierarchy (skip generic "agent")
    for (let i = 2; i < pathParts.length; i++) {
      const parentParts = pathParts.slice(0, i);
      const childParts = pathParts.slice(0, i + 1);
      const parentId = parentParts.join("-");
      const childId = childParts.join("-");
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

    for (const ownedNamespace of ownedNamespaces) {
      DelegationTreeManager.processAccessibleNamespaces(
        [ownedNamespace], // Single namespace as array
        ownedNamespace, // Self-reference for the key
        null, // Infinite redelegations
        nodeMap,
      );
      allNamespaces.add(ownedNamespace);
    }

    // Step 4: Process delegated permissions
    for (const [_permissionId, permission] of agentPermissions) {
      if (!("Namespace" in permission.scope)) continue;

      const namespaceScope = permission.scope.Namespace;

      // Step 5: Get delegator's actual owned namespaces from torus0.namespaces
      const delegatorNamespaces =
        await DelegationTreeManager.queryNamespaceEntriesForAddress(
          api,
          permission.delegator,
        );
      if (!delegatorNamespaces) continue;

      // Step 4: Process agent's owned namespaces
      for (const [_, pathsArray] of namespaceScope.paths) {
        for (const ownedPath of pathsArray) {
          const ownedNamespace = ownedPath.join(".");

          // Step 5: Find all downstream namespaces that the agent can delegate
          const accessibleNamespaces = Array.from(delegatorNamespaces).filter(
            (ns) => ns.startsWith(ownedNamespace),
          );

          // Step 6: Build nodes for the accessible namespaces
          DelegationTreeManager.processAccessibleNamespaces(
            accessibleNamespaces,
            ownedNamespace,
            Number(permission.maxInstances),
            nodeMap,
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
    manager.ownedNamespaces = ownedNamespaces;
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
   * Update the redelegation count for a specific parent reference in a node
   * This will cascade the change to all descendant nodes
   *
   * @returns The actual value that was set, null if self-owned (infinite), or undefined if node not found
   */
  updateRedelegationCount(
    nodeId: string,
    parentReference: string,
    newCount: number | null,
  ): number | null | undefined {
    const node = this.nodes.get(nodeId);
    if (!node) return undefined;

    // Convert nodeId back to namespace to check if we own it
    const namespace = nodeId.replace(/-/g, ".");

    // Check if this namespace is owned by our agent
    // Self-owned namespaces always have infinite (null) redelegation count and can't be updated
    if (this.ownedNamespaces.has(namespace)) {
      return null; // Return null to indicate infinite/unchanged
    }

    // Update the node's own count
    node.redelegationCount.set(parentReference, newCount);

    // Cascade to all descendants
    this.cascadeRedelegationCount(nodeId, parentReference, newCount);

    return newCount;
  }

  /**
   * Get all descendant nodes of a given node
   */
  private getDescendants(nodeId: string): Set<string> {
    const descendants = new Set<string>();
    const stack = [nodeId];

    while (stack.length > 0) {
      const currentId = stack.pop();
      if (currentId === undefined) {
        console.warn("Stack.pop() returned undefined when stack length > 0");
        throw new Error("Unexpected undefined value from stack.pop()");
      }
      const children = this.parentChildMap.get(currentId);

      if (children) {
        for (const childId of children) {
          if (!descendants.has(childId)) {
            descendants.add(childId);
            stack.push(childId);
          }
        }
      }
    }

    return descendants;
  }

  /**
   * Cascade redelegation count changes to all descendants
   */
  private cascadeRedelegationCount(
    sourceNodeId: string,
    parentReference: string,
    newCount: number | null,
  ): void {
    const descendants = this.getDescendants(sourceNodeId);

    for (const descendantId of descendants) {
      const descendantNode = this.nodes.get(descendantId);
      if (descendantNode?.redelegationCount.has(parentReference)) {
        descendantNode.redelegationCount.set(parentReference, newCount);
      }
    }
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
   * Get total redelegation count for a node (sum of all parent contributions)
   * Returns null if any contribution is infinite (null)
   */
  getTotalRedelegationCount(nodeId: string): number | null {
    const node = this.nodes.get(nodeId);
    if (!node) return 0;

    let total = 0;
    for (const count of node.redelegationCount.values()) {
      if (count === null) return null; // Infinite delegation capability
      total += count;
    }
    return total;
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
   * Get the weakest (most specific) node that can delegate to the target namespace.
   * Returns the node with available redelegation instances that is closest/most specific to the target.
   *
   * @param targetNamespace - The namespace to delegate (e.g., "agent.arthur.doyle.run")
   * @returns The most specific node that can delegate to this target, or null if none available
   *
   * @example
   * ```ts
   * // If we want to delegate "agent.arthur.doyle.run" and we have:
   * // - agent-arthur (5 instances)
   * // - agent-arthur-doyle-run (2 instances)
   * // This returns agent-arthur-doyle-run because it's more specific
   * const weakest = manager.getWeakestDelegator("agent.arthur.doyle.run");
   * ```
   */
  getWeakestDelegator(targetNamespace: string): DelegationNodeData | null {
    const targetNodeId = targetNamespace.replace(/\./g, "-");

    // Find all nodes that can delegate to this target
    const candidates: DelegationNodeData[] = [];

    for (const node of this.nodes.values()) {
      // Skip non-accessible nodes
      if (!node.accessible) continue;

      // Check if this node has available redelegation instances
      const totalCount = this.getTotalRedelegationCount(node.id);
      if (totalCount === 0) continue;

      // Check if the target is this node or a descendant of this node
      if (targetNodeId === node.id || targetNodeId.startsWith(node.id + "-")) {
        candidates.push(node);
      }
    }

    if (candidates.length === 0) return null;

    // Sort by specificity (longest node ID = most specific)
    // The "weakest" delegator is the one with the longest/most specific path
    candidates.sort((a, b) => {
      const aDepth = a.id.split("-").length;
      const bDepth = b.id.split("-").length;
      return bDepth - aDepth; // Descending order - most specific first
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return candidates[0]!;
  }

  /**
   * Get all nodes that can delegate to a target namespace, ordered by specificity (weakest first)
   *
   * @param targetNamespace - The namespace to delegate
   * @returns Array of nodes that can delegate, ordered from most specific to least specific
   */
  getAllDelegatorsFor(targetNamespace: string): DelegationNodeData[] {
    const targetNodeId = targetNamespace.replace(/\./g, "-");

    const candidates: DelegationNodeData[] = [];

    for (const node of this.nodes.values()) {
      // Skip non-accessible nodes
      if (!node.accessible) continue;

      // Check if this node has available redelegation instances
      const totalCount = this.getTotalRedelegationCount(node.id);
      if (totalCount === 0) continue;

      // Check if the target is this node or a descendant of this node
      if (targetNodeId === node.id || targetNodeId.startsWith(node.id + "-")) {
        candidates.push(node);
      }
    }

    // Sort by specificity (longest node ID = most specific)
    candidates.sort((a, b) => {
      const aDepth = a.id.split("-").length;
      const bDepth = b.id.split("-").length;
      return bDepth - aDepth; // Descending order - most specific first
    });

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
}

/**
 * Utility function to convert a namespace path to a node ID
 */
export function namespaceToNodeId(namespacePath: string): string {
  return namespacePath.replace(/\./g, "-");
}

/**
 * Utility function to convert a node ID back to namespace path
 */
export function nodeIdToNamespace(nodeId: string): string {
  return nodeId.replace(/-/g, ".");
}

/**
 * Utility function to get the parent node ID for a given node ID
 */
export function getParentNodeId(nodeId: string): string | null {
  const parts = nodeId.split("-");
  if (parts.length <= 1) return null;
  return parts.slice(0, -1).join("-");
}

/**
 * Utility function to get all child node IDs for a given node ID
 */
export function getChildNodeIds(
  nodeId: string,
  allNodes: DelegationNodeData[],
): string[] {
  const targetPrefix = nodeId + "-";
  return allNodes
    .map((node) => node.id)
    .filter(
      (id) =>
        id.startsWith(targetPrefix) &&
        id.split("-").length === nodeId.split("-").length + 1,
    );
}
