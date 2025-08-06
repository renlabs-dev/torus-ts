import type { Edge, Node } from "@xyflow/react";

import type { DelegationTreeManager } from "@torus-network/sdk/chain";
import { nodeIdToNamespace } from "@torus-network/sdk/chain";

import { PermissionColorManager } from "./permission-colors";
import type { NamespacePathNodeData, PermissionInfo } from "./types";

export function adaptDelegationTreeToReactFlow(
  treeManager: DelegationTreeManager,
): {
  nodes: Node<NamespacePathNodeData>[];
  edges: Edge[];
  colorManager: PermissionColorManager;
  treeManager: DelegationTreeManager;
} {
  const colorManager = new PermissionColorManager();

  const nodes: Node<NamespacePathNodeData>[] = treeManager
    .getNodes()
    .map((node, index) => {
      // Get permissions for this node using the new API
      const nodePermissions = treeManager.getNodePermissions(node.id);

      // Convert permissions to PermissionInfo with colors
      const permissions: PermissionInfo[] = Array.from(
        nodePermissions.entries(),
      ).map(([permissionId, count]) => {
        const color = colorManager.getColorForPermission(permissionId);
        return {
          permissionId,
          count,
          color: color.hex,
        };
      });

      return {
        id: node.id,
        type: "namespacePath",
        position: { x: (index % 3) * 200, y: Math.floor(index / 3) * 100 },
        data: {
          label: nodeIdToNamespace(node.id),
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

  return { nodes, edges, colorManager, treeManager };
}
