import type { NodeObject } from "r3f-forcegraph";
import type {
  CustomGraphLink,
  CustomGraphNode,
} from "../permission-graph-types";

export function useGraphInteractions(
  graphData: { nodes: CustomGraphNode[]; links: CustomGraphLink[] },
  onNodeClick: (node: CustomGraphNode) => void,
  _selectedNodeId?: string | null,
) {
  const handleNodeClick = (node: NodeObject) => {
    const originalNode = graphData.nodes.find((n) => n.id === node.id);
    if (originalNode) {
      onNodeClick(originalNode);
    }
  };

  return {
    handleNodeClick,
  };
}
