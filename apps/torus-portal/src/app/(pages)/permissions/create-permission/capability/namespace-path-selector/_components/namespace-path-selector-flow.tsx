"use client";

import "@xyflow/react/dist/style.css";

import { useCallback, useEffect, useMemo, useState } from "react";

import type { Node } from "@xyflow/react";
import {
  Background,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";

import { Badge } from "@torus-ts/ui/components/badge";
import { Button } from "@torus-ts/ui/components/button";

import type { LayoutOptions } from "~/app/_components/react-flow-layout/use-auto-layout";
import useAutoLayout from "~/app/_components/react-flow-layout/use-auto-layout";

import {
  edges as initialEdges,
  nodes as initialNodes,
} from "./mock-capability-path-data";
import { NamespacePathNode } from "./namespace-path-node";

const nodeTypes = {
  namespacePath: NamespacePathNode,
};

const proOptions = {
  hideAttribution: true,
};
export interface NamespacePathNodeData extends Record<string, unknown> {
  label: string;
  acessible: boolean;
  redelegationCount: number;
  selected?: boolean;
}

function NamespacePathFlow() {
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState(
    initialNodes.map((node, index) => ({
      ...node,
      type: "namespacePath",
      // Give initial spread positions to avoid overlap while layout loads
      position: { x: (index % 3) * 200, y: Math.floor(index / 3) * 100 },
      data: {
        ...node.data,
        selected: false,
      } as NamespacePathNodeData,
    })),
  );
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());

  const layoutOptions: LayoutOptions = useMemo(
    () => ({
      algorithm: "d3-hierarchy",
      direction: "LR",
      spacing: [40, 60],
    }),
    [],
  );

  // Apply auto-layout using the constraint layout utilities
  useAutoLayout(layoutOptions);

  // Helper function to get all descendant node IDs
  const getDescendantIds = useCallback(
    (nodeId: string): string[] => {
      const descendants: string[] = [];
      const queue = [nodeId];

      while (queue.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const currentId = queue.shift()!;
        // Find all edges where current node is the source
        const childEdges = edges.filter((edge) => edge.source === currentId);
        for (const edge of childEdges) {
          descendants.push(edge.target);
          queue.push(edge.target);
        }
      }

      return descendants;
    },
    [edges],
  );

  const handleNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node<NamespacePathNodeData>) => {
      // Only handle clicks on accessible nodes
      if (!node.data.acessible) {
        return;
      }

      const nodeId = node.id;
      const isCurrentlySelected = selectedPaths.has(nodeId);
      const newSelectedPaths = new Set(selectedPaths);

      if (isCurrentlySelected) {
        // Deselecting: remove node and all its descendants
        newSelectedPaths.delete(nodeId);
        const descendants = getDescendantIds(nodeId);
        descendants.forEach((id) => newSelectedPaths.delete(id));
      } else {
        // Selecting: add node and all its descendants (if accessible)
        newSelectedPaths.add(nodeId);
        const descendants = getDescendantIds(nodeId);
        descendants.forEach((descendantId) => {
          const descendantNode = nodes.find((n) => n.id === descendantId);
          if (descendantNode?.data.acessible) {
            newSelectedPaths.add(descendantId);
          }
        });
      }

      setSelectedPaths(newSelectedPaths);

      // Update node data to reflect selection state
      setNodes((currentNodes) =>
        currentNodes.map((n) => {
          const shouldBeSelected = newSelectedPaths.has(n.id);
          return {
            ...n,
            data: {
              ...n.data,
              selected: shouldBeSelected,
            },
          };
        }),
      );
    },
    [selectedPaths, nodes, setNodes, getDescendantIds],
  );

  const handleClearSelection = useCallback(() => {
    setSelectedPaths(new Set());
    setNodes((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          selected: false,
        },
      })),
    );
  }, [setNodes]);

  // Fit view when nodes change, with a slight delay to ensure layout is applied
  useEffect(() => {
    const timer = setTimeout(() => {
      void fitView({ padding: 0.1, duration: 800 });
    }, 100);
    return () => clearTimeout(timer);
  }, [nodes, fitView]);

  const selectedCount = selectedPaths.size;
  const accessibleCount = nodes.filter((node) => node.data.acessible).length;
  const totalCount = nodes.length;

  return (
    <div className="h-full w-full relative -top-14">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        nodesFocusable={true}
        edgesFocusable={false}
        proOptions={proOptions}
        minZoom={0.6}
        maxZoom={1.7}
      >
        <Background />

        <Panel position="top-left" className="pt-10 space-x-2 z-50">
          <Badge variant="default">
            {selectedCount} of {accessibleCount} selected
          </Badge>
          <Badge variant="secondary">
            {totalCount - accessibleCount} view-only
          </Badge>
        </Panel>

        <Panel
          position="bottom-right"
          className="flex gap-2 z-50 pb-4 shadow-lg"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearSelection}
            disabled={selectedCount === 0}
          >
            Clear Selection
          </Button>
          <Button size="sm" disabled={selectedCount === 0}>
            Create Permission ({selectedCount} paths)
          </Button>
        </Panel>

        {selectedCount > 0 && (
          <Panel
            position="bottom-left"
            className="bg-green-500/10 border-green-500/20 border rounded-sm p-2 z-50 shadow-lg"
          >
            <div className="space-y-1">
              <div className="text-sm font-medium text-green-700 dark:text-green-300">
                Selected Paths:
              </div>
              <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
                {Array.from(selectedPaths).map((nodeId) => {
                  const node = nodes.find((n) => n.id === nodeId);
                  return (
                    <div
                      key={nodeId}
                      className="font-mono text-green-600 dark:text-green-400"
                    >
                      {String(node?.data.label ?? "")}
                    </div>
                  );
                })}
              </div>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}

export function NamespacePathSelectorFlow() {
  return (
    <ReactFlowProvider>
      <NamespacePathFlow />
    </ReactFlowProvider>
  );
}
