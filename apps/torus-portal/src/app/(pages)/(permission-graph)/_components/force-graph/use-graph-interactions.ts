import { useState, useCallback, useMemo } from "react";
import type { NodeObject, LinkObject } from "r3f-forcegraph";
import type {
  CustomGraphNode,
  CustomGraphLink,
} from "../permission-graph-types";
import type { HighlightState } from "./force-graph-highlight-utils";
import {
  createParentMap,
  calculateHoverHighlights,
  calculateSelectionHighlights,
  calculateLinkHighlights,
} from "./force-graph-highlight-utils";

export function useGraphInteractions(
  graphData: { nodes: CustomGraphNode[]; links: CustomGraphLink[] },
  onNodeClick: (node: CustomGraphNode) => void,
  selectedNodeId?: string | null,
) {
  const [highlightNodes, setHighlightNodes] = useState<Set<string>>(new Set());
  const [highlightLinks, setHighlightLinks] = useState<Set<string>>(new Set());
  const [hoverNode, setHoverNode] = useState<string | null>(null);

  const parentMap = useMemo(
    () => createParentMap(graphData.links),
    [graphData.links],
  );

  // Update highlights when selected node changes
  useMemo(() => {
    if (selectedNodeId) {
      const selectedNode = graphData.nodes.find((n) => n.id === selectedNodeId);
      if (selectedNode) {
        const {
          highlightNodes: newHighlightNodes,
          highlightLinks: newHighlightLinks,
        } = calculateSelectionHighlights(selectedNode, parentMap, graphData.links);
        
        setHighlightNodes(newHighlightNodes);
        setHighlightLinks(newHighlightLinks);
      }
    } else if (!hoverNode) {
      // Clear highlights if no selection and no hover
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
    }
  }, [selectedNodeId, parentMap, graphData.links, graphData.nodes, hoverNode]);

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
      if (node && !selectedNodeId) {
        // Only apply hover highlights if no node is selected
        const {
          highlightNodes: newHighlightNodes,
          highlightLinks: newHighlightLinks,
        } = calculateHoverHighlights(node);

        setHoverNode(String(node.id));
        setHighlightNodes(newHighlightNodes);
        setHighlightLinks(newHighlightLinks);
      } else if (!node && !selectedNodeId) {
        // Clear hover highlights only if no node is selected
        setHoverNode(null);
        setHighlightNodes(new Set());
        setHighlightLinks(new Set());
      } else if (node) {
        // Just track hover for visual feedback but don't change highlights
        setHoverNode(String(node.id));
      } else {
        setHoverNode(null);
      }
    },
    [selectedNodeId],
  );

  const handleLinkHover = useCallback((link: LinkObject | null) => {
    if (link) {
      const {
        highlightNodes: newHighlightNodes,
        highlightLinks: newHighlightLinks,
      } = calculateLinkHighlights(link);

      setHighlightNodes(newHighlightNodes);
      setHighlightLinks(newHighlightLinks);
    } else {
      setHoverNode(null);
      setHighlightNodes(new Set());
      setHighlightLinks(new Set());
    }
  }, []);

  return {
    highlightState,
    handleNodeClick,
    handleNodeHover,
    handleLinkHover,
  };
}
