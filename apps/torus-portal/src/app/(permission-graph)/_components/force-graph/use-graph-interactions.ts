import { useState, useCallback, useMemo } from "react";
import type { NodeObject, LinkObject } from "r3f-forcegraph";
import type {
  CustomGraphNode,
  CustomGraphLink,
} from "../permission-graph-types";
import type { HighlightState } from "./force-graph-highlight-utils";
import {
  createNeighborMap,
  calculateNodeHighlights,
  calculateLinkHighlights,
} from "./force-graph-highlight-utils";

export function useGraphInteractions(
  graphData: { nodes: CustomGraphNode[]; links: CustomGraphLink[] },
  onNodeClick: (node: CustomGraphNode) => void,
) {
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());
  const [highlightLinks, setHighlightLinks] = useState<Set<string>>(new Set());
  const [hoverNode, setHoverNode] = useState<string | null>(null);

  const neighborMap = useMemo(
    () => createNeighborMap(graphData.links),
    [graphData.links],
  );

  const highlightState: HighlightState = {
    highlightNodes,
    highlightLinks,
    hoverNode,
  };

  const handleNodeClick = useCallback(
    (node: NodeObject) => {
      const originalNode = graphData.nodes.find((n) => n.id === node.id);
      if (originalNode) {
        onNodeClick(originalNode);
      }
    },
    [graphData.nodes, onNodeClick],
  );

  const handleNodeHover = useCallback(
    (node: NodeObject | null) => {
      if (node) {
        const {
          highlightNodes: newHighlightNodes,
          highlightLinks: newHighlightLinks,
        } = calculateNodeHighlights(node, neighborMap, graphData.links);

        setHoverNode(String(node.id));
        setHighlightNodes(newHighlightNodes);
        setHighlightLinks(newHighlightLinks);
      }
    },
    [neighborMap, graphData.links],
  );

  const handleLinkHover = useCallback((link: LinkObject | null) => {
    if (link) {
      const {
        highlightNodes: newHighlightNodes,
        highlightLinks: newHighlightLinks,
      } = calculateLinkHighlights(link);

      setHighlightNodes(newHighlightNodes);
      setHighlightLinks(newHighlightLinks);
    }
  }, []);

  return {
    highlightState,
    handleNodeClick,
    handleNodeHover,
    handleLinkHover,
  };
}
