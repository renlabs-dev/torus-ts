import type { Node } from "@xyflow/react";

import { nodeIdToNamespace } from "@torus-network/sdk/chain";

import type { NamespacePathNodeData, PathWithPermission } from "./types";

/**
 * Creates an array of paths with their associated permissions from selected nodes
 */
export function createPathsWithPermissions(
  selectedPaths: Set<string>,
  nodes: Node<NamespacePathNodeData>[],
): PathWithPermission[] {
  return Array.from(selectedPaths)
    .map((nodeId) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node?.data.selectedPermission) return null;

      return {
        path: nodeIdToNamespace(nodeId),
        permissionId:
          node.data.selectedPermission === "self"
            ? null
            : node.data.selectedPermission,
      };
    })
    .filter((item): item is PathWithPermission => item !== null);
}
