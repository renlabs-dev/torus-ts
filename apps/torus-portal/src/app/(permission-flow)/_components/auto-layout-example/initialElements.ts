import { type Node, type Edge } from '@xyflow/react';

export const nodes: Node[] = [
  {
    id: '1',
    data: { label: 'Node 1' },
    position: { x: 0, y: 0 },
  },
  {
    id: '2',
    data: { label: 'Node 2' },
    position: { x: 0, y: 0 },
  },
  {
    id: '3',
    data: { label: 'Node 3' },
    position: { x: 0, y: 0 },
  },
  {
    id: '4',
    data: { label: 'Node 4' },
    position: { x: 0, y: 0 },
  },
  {
    id: '5',
    data: { label: 'Node 5' },
    position: { x: 0, y: 0 },
  },
];

export const edges: Edge[] = [
  {
    id: '1->2',
    source: '1',
    target: '2',
  },
  {
    id: '1->3',
    source: '1',
    target: '3',
  },
  {
    id: '4->5',
    source: '4',
    target: '5',
  },
];
