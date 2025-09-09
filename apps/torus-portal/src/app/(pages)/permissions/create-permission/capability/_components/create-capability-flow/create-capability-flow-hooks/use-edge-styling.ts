import type { Edge, Node } from "@xyflow/react";
import { useCallback, useMemo } from "react";
import type { NamespacePathNodeData } from "../create-capability-flow-types";

interface UseEdgeStylingProps {
  nodes: Node<NamespacePathNodeData>[];
  edges: Edge[];
  selectedPaths: Set<string>;
}

export function useEdgeStyling({
  nodes,
  edges,
  selectedPaths,
}: UseEdgeStylingProps) {
  const nodeAccessibilityMap = useMemo(() => {
    const map = new Map<string, boolean>();
    nodes.forEach((node) => {
      map.set(node.id, node.data.accessible);
    });
    return map;
  }, [nodes]);

  const getStyledEdges = useCallback(() => {
    return edges.map((edge) => {
      const sourceAccessible = nodeAccessibilityMap.get(edge.source) ?? false;
      const targetAccessible = nodeAccessibilityMap.get(edge.target) ?? false;

      const isDescendantOfSelected =
        selectedPaths.has(edge.source) && selectedPaths.has(edge.target);

      let style: React.CSSProperties = {};

      if (isDescendantOfSelected) {
        style = {
          strokeDasharray: "8,4",
          stroke: "#ffffff",
          strokeDashoffset: "0",
          animation: "dash 1s linear infinite",
        };
      } else if (!sourceAccessible || !targetAccessible) {
        style = {
          stroke: "#374151",
          opacity: 0.8,
        };
      } else {
        style = {
          stroke: "#9ca3af",
        };
      }

      return {
        ...edge,
        style,
      };
    });
  }, [edges, nodeAccessibilityMap, selectedPaths]);

  return { getStyledEdges };
}
