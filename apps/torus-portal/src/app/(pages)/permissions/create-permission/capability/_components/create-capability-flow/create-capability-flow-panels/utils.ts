import type { Node } from "@xyflow/react";

import type { NamespacePathNodeData, PathWithPermission } from "../types";

/**
 * Converts selected node IDs to PathWithPermission format for permission creation
 */
export function createPathsWithPermissions(
  rootSelectedPaths: Set<string>,
  nodes: Node<NamespacePathNodeData>[],
): PathWithPermission[] {
  return Array.from(rootSelectedPaths)
    .map((nodeId) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node?.data.selectedPermission) return null;

      return {
        path: nodeId,
        permissionId:
          node.data.selectedPermission === "self"
            ? null
            : node.data.selectedPermission,
      };
    })
    .filter((item): item is PathWithPermission => item !== null);
}