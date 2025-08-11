import type { Edge, Node } from "@xyflow/react";

import d3Hierarchy from "./react-flow-layout-d3-algorithm";

// the layout direction (T = top, R = right, B = bottom, L = left, TB = top to bottom, ...)
export type Direction = "TB" | "LR" | "RL" | "BT";

export interface LayoutAlgorithmOptions {
  direction: Direction;
  spacing: [number, number];
}

export type LayoutAlgorithm = (
  nodes: Node[],
  edges: Edge[],
  options: LayoutAlgorithmOptions,
) => Promise<{ nodes: Node[]; edges: Edge[] }>;

export default {
  "d3-hierarchy": d3Hierarchy,
};
