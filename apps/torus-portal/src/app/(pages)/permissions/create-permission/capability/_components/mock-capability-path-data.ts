import type { Edge, Node } from "@xyflow/react";

interface NamespacePathNodeData extends Record<string, unknown> {
  label: string;
  acessible: boolean;
  redelegationCount: number;
}

export const nodes: Node<NamespacePathNodeData>[] = [
  {
    id: "1",
    data: {
      label: "agent.alice.api",
      acessible: false,
      redelegationCount: 5,
    },
    position: { x: 0, y: 0 },
  },
  {
    id: "2",
    data: {
      label: "agent.alice.api.x",
      acessible: false,
      redelegationCount: 2,
    },
    position: { x: 0, y: 0 },
  },
  {
    id: "3",
    data: {
      label: "agent.alice.api.x.post",
      acessible: true,
      redelegationCount: 0,
    },
    position: { x: 0, y: 0 },
  },
  {
    id: "4",
    data: {
      label: "diana.network",
      acessible: true,
      redelegationCount: 3,
    },
    position: { x: 0, y: 0 },
  },
  {
    id: "5",
    data: {
      label: "diana.network.storage",
      acessible: true,
      redelegationCount: 1,
    },
    position: { x: 0, y: 0 },
  },
];

export const edges: Edge[] = [
  {
    id: "1-2",
    source: "1",
    target: "2",
  },
  {
    id: "2-3",
    source: "2",
    target: "3",
  },
  {
    id: "4-5",
    source: "4",
    target: "5",
  },
];
