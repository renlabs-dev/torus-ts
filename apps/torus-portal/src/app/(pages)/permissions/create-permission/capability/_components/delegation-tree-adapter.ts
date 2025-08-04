import type { Edge, Node } from "@xyflow/react";

import type { DelegationTreeManager } from "@torus-network/sdk/chain";
import { nodeIdToNamespace } from "@torus-network/sdk/chain";

import type { NamespacePathNodeData } from "./namespace-path-selector-flow";

export function adaptDelegationTreeToReactFlow(
  treeManager: DelegationTreeManager,
): {
  nodes: Node<NamespacePathNodeData>[];
  edges: Edge[];
} {
  const nodes: Node<NamespacePathNodeData>[] = treeManager
    .getNodes()
    .map((node, index) => {
      const totalCount = treeManager.getTotalRedelegationCount(node.id);

      return {
        id: node.id,
        type: "namespacePath",
        position: { x: (index % 3) * 200, y: Math.floor(index / 3) * 100 },
        data: {
          label: nodeIdToNamespace(node.id), // Convert back to namespace format for display
          accessible: node.accessible,
          redelegationCount: totalCount ?? Infinity, // Display infinity for null counts
          selected: false,
        } satisfies NamespacePathNodeData,
      };
    });

  const edges: Edge[] = treeManager.getEdges().map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
  }));

  return { nodes, edges };
}
