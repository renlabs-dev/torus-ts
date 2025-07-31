"use client";

import "@xyflow/react/dist/style.css";

import { useCallback, useEffect, useState, useMemo } from "react";

import {
  Background,
  Controls,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow
  
} from "@xyflow/react";
import type {Node} from "@xyflow/react";

import { Badge } from "@torus-ts/ui/components/badge";
import { Button } from "@torus-ts/ui/components/button";

import type { LayoutOptions } from "~/app/(pages)/create-constraint/_components/constraint-layout/use-auto-layout";
import useAutoLayout from "~/app/(pages)/create-constraint/_components/constraint-layout/use-auto-layout";

import {
  edges as initialEdges,
  nodes as initialNodes,
} from "../../_components/mock-capability-path-data";
import { NamespacePathNode } from "./namespace-path-node";

const nodeTypes = {
  namespacePath: NamespacePathNode,
};

const proOptions = {
  hideAttribution: true,
};

interface NamespacePathNodeData extends Record<string, unknown> {
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
      direction: "TB",
      spacing: [50, 80],
    }),
    []
  );

  // Apply auto-layout using the constraint layout utilities
  useAutoLayout(layoutOptions);

  // Helper function to get all descendant node IDs
  const getDescendantIds = useCallback((nodeId: string): string[] => {
    const descendants: string[] = [];
    const queue = [nodeId];
    
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      // Find all edges where current node is the source
      const childEdges = edges.filter(edge => edge.source === currentId);
      for (const edge of childEdges) {
        descendants.push(edge.target);
        queue.push(edge.target);
      }
    }
    
    return descendants;
  }, [edges]);


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
        descendants.forEach(id => newSelectedPaths.delete(id));
      } else {
        // Selecting: add node and all its descendants (if accessible)
        newSelectedPaths.add(nodeId);
        const descendants = getDescendantIds(nodeId);
        descendants.forEach(descendantId => {
          const descendantNode = nodes.find(n => n.id === descendantId);
          if (descendantNode?.data.acessible) {
            newSelectedPaths.add(descendantId);
          }
        });

        // Also check if all siblings are selected to auto-select parent
        const parentEdge = edges.find(edge => edge.target === nodeId);
        if (parentEdge) {
          const siblingEdges = edges.filter(edge => edge.source === parentEdge.source);
          const allSiblingsSelected = siblingEdges.every(edge => 
            newSelectedPaths.has(edge.target)
          );
          if (allSiblingsSelected) {
            const parentNode = nodes.find(n => n.id === parentEdge.source);
            if (parentNode?.data.acessible) {
              newSelectedPaths.add(parentEdge.source);
            }
          }
        }
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
    [selectedPaths, nodes, edges, setNodes, getDescendantIds],
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

  const handleSelectAll = useCallback(() => {
    // Get all root nodes (nodes with no incoming edges)
    const rootNodeIds = nodes
      .filter(node => {
        const hasParent = edges.some(edge => edge.target === node.id);
        return !hasParent && node.data.acessible;
      })
      .map(node => node.id);

    const allSelectedIds = new Set<string>();
    
    // For each root, add it and all its accessible descendants
    rootNodeIds.forEach(rootId => {
      allSelectedIds.add(rootId);
      const descendants = getDescendantIds(rootId);
      descendants.forEach(descendantId => {
        const node = nodes.find(n => n.id === descendantId);
        if (node?.data.acessible) {
          allSelectedIds.add(descendantId);
        }
      });
    });
    
    setSelectedPaths(allSelectedIds);
    setNodes((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          selected: allSelectedIds.has(node.id),
        },
      })),
    );
  }, [nodes, edges, setNodes, getDescendantIds]);

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
    <div className="h-full w-full relative">
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
        style={{
          backgroundColor: "#0E0E11",
        }}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.1}
        maxZoom={2}
      >
        <Background />
        <Controls />

        <Panel
          position="top-left"
          className="bg-background border rounded-lg p-4 shadow-lg"
        >
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Namespace Path Selection</h3>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="default">
                {selectedCount} of {accessibleCount} selected
              </Badge>
              <Badge variant="secondary">
                {totalCount - accessibleCount} view-only
              </Badge>
            </div>
          </div>
        </Panel>

        <Panel position="bottom-right" className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearSelection}
            disabled={selectedCount === 0}
          >
            Clear Selection
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            disabled={selectedCount === accessibleCount}
          >
            Select All Accessible
          </Button>
          <Button size="sm" disabled={selectedCount === 0}>
            Create Permission ({selectedCount} paths)
          </Button>
        </Panel>

        {selectedCount > 0 && (
          <Panel
            position="top-right"
            className="bg-green-500/10 border-green-500/20 border rounded-lg p-3"
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
                      {String(node?.data.label ?? '')}
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
