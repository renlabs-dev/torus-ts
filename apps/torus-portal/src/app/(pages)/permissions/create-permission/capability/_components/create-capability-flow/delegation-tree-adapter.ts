import type { Edge, Node } from "@xyflow/react";

import type { DelegationTreeManager } from "@torus-network/sdk/chain";

import { getPermissionColor } from "./permission-colors";
import type { NamespacePathNodeData, PermissionInfo } from "./types";

export function adaptDelegationTreeToReactFlow(
  treeManager: DelegationTreeManager,
): {
  nodes: Node<NamespacePathNodeData>[];
  edges: Edge[];
  treeManager: DelegationTreeManager;
} {
  const nodes: Node<NamespacePathNodeData>[] = treeManager
    .getNodes()
    .map((node, index) => {
      // Get permissions for this node using the new API
      const nodePermissions = treeManager.getNodePermissions(node.id);

      // Convert permissions to PermissionInfo with color names
      const permissions: PermissionInfo[] = Array.from(
        nodePermissions.entries(),
      ).map(([permissionId, count]) => {
        const colorName = getPermissionColor(permissionId);
        return {
          permissionId,
          count,
          colorName,
        };
      });

      return {
        id: node.id,
        type: "namespacePath",
        position: { x: (index % 3) * 200, y: Math.floor(index / 3) * 100 },
        data: {
          label: node.id,
          accessible: node.accessible,
          permissions,
          selectedPermission: null,
        } satisfies NamespacePathNodeData,
      };
    });

  const edges: Edge[] = treeManager.getEdges().map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
  }));

  return { nodes, edges, treeManager };
}
