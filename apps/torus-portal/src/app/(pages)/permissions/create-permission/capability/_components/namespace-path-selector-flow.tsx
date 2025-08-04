"use client";

import "@xyflow/react/dist/style.css";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import type { Edge, Node } from "@xyflow/react";
import {
  Background,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "@xyflow/react";

import { useTorus } from "@torus-ts/torus-provider";
import { Badge } from "@torus-ts/ui/components/badge";
import { Button } from "@torus-ts/ui/components/button";

import type { LayoutOptions } from "~/app/_components/react-flow-layout/use-auto-layout";
import useAutoLayout from "~/app/_components/react-flow-layout/use-auto-layout";

import { NamespacePathNode } from "./namespace-path-node";
import { useDelegationTree } from "./use-delegation-tree";

const nodeTypes = {
  namespacePath: NamespacePathNode,
};

const proOptions = {
  hideAttribution: true,
};
export interface NamespacePathNodeData extends Record<string, unknown> {
  label: string;
  accessible: boolean;
  redelegationCount: number;
  selected?: boolean;
}

interface NamespacePathFlowProps {
  onCreatePermission?: (selectedPaths: string[]) => void;
}

function NamespacePathFlow({ onCreatePermission }: NamespacePathFlowProps) {
  const { fitView } = useReactFlow();
  const queryClient = useQueryClient();
  const { selectedAccount } = useTorus();
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [currentWallet, setCurrentWallet] = useState<string | null>(
    selectedAccount?.address ?? null,
  );

  // Track wallet changes and force immediate state clearing
  const walletAddress = selectedAccount?.address ?? null;
  const isWalletChanging = currentWallet !== walletAddress;

  // Fetch real delegation tree data, but disable during wallet changes
  const {
    data: delegationData,
    isLoading,
    error,
    refetch,
  } = useDelegationTree({
    enabled: !isWalletChanging,
  });

  const [nodes, setNodes, onNodesChange] = useNodesState<
    Node<NamespacePathNodeData>
  >([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Handle wallet changes
  useEffect(() => {
    if (isWalletChanging) {
      // Immediately clear all state when wallet changes
      setNodes([]);
      setEdges([]);
      setSelectedPaths(new Set());

      // Update current wallet and refetch for new wallet
      setCurrentWallet(walletAddress);

      // Invalidate queries and refetch
      void queryClient.invalidateQueries({
        queryKey: ["delegationTree"],
      });

      // Wait a tick for the wallet to be updated, then refetch
      setTimeout(() => {
        void refetch();
      }, 100);
    }
  }, [
    isWalletChanging,
    walletAddress,
    setNodes,
    setEdges,
    queryClient,
    refetch,
  ]);

  // Update nodes and edges when delegation data loads
  useEffect(() => {
    if (delegationData && !isWalletChanging) {
      setNodes(delegationData.nodes);
      setEdges(delegationData.edges);
    }
  }, [delegationData, setNodes, setEdges, isWalletChanging]);

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
      if (!node.data.accessible) {
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
          if (descendantNode?.data.accessible) {
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

      // Update edge styles based on selection state
      setEdges((currentEdges) =>
        currentEdges.map((edge) => {
          const sourceSelected = newSelectedPaths.has(edge.source);
          const targetSelected = newSelectedPaths.has(edge.target);
          const bothSelected = sourceSelected && targetSelected;

          return {
            ...edge,
            style: bothSelected
              ? {
                  stroke: "#22c55e",
                  strokeWidth: 2,
                }
              : {
                  stroke: "#64748b",
                  strokeWidth: 1,
                },
          };
        }),
      );
    },
    [selectedPaths, nodes, setNodes, setEdges, getDescendantIds],
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
    // Reset edge styles when clearing selection
    setEdges((currentEdges) =>
      currentEdges.map((edge) => ({
        ...edge,
        style: {
          stroke: "#64748b",
          strokeWidth: 1,
        },
      })),
    );
  }, [setNodes, setEdges]);

  // Fit view when nodes change, with a slight delay to ensure layout is applied
  useEffect(() => {
    const timer = setTimeout(() => {
      void fitView({ padding: 0.1, duration: 800 });
    }, 100);
    return () => clearTimeout(timer);
  }, [nodes, fitView]);

  const selectedCount = selectedPaths.size;
  const accessibleCount = nodes.filter((node) => node.data.accessible).length;
  const totalCount = nodes.length;

  // Show loading state
  if (isLoading || isWalletChanging) {
    return (
      <div className="h-full w-full relative -top-14 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-lg font-medium">
            {isWalletChanging
              ? "Switching wallet..."
              : "Loading namespace permissions..."}
          </div>
          <div className="text-sm text-muted-foreground">
            {isWalletChanging
              ? "Updating delegation tree for new wallet"
              : "Fetching delegation tree from blockchain"}
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="h-full w-full relative -top-14 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-lg font-medium text-destructive">
            Failed to load delegation tree
          </div>
          <div className="text-sm text-muted-foreground">{error.message}</div>
        </div>
      </div>
    );
  }

  // Show empty state if no nodes
  if (!delegationData || nodes.length === 0) {
    return (
      <div className="h-full w-full relative -top-14 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-lg font-medium">
            No delegation permissions found
          </div>
          <div className="text-sm text-muted-foreground">
            You don't have any namespace permissions to delegate
          </div>
        </div>
      </div>
    );
  }

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
          <Button
            size="sm"
            disabled={selectedCount === 0}
            onClick={() => {
              if (selectedCount > 0 && onCreatePermission) {
                const selectedNamespaces = Array.from(selectedPaths)
                  .map((nodeId) => {
                    const node = nodes.find((n) => n.id === nodeId);
                    return String(node?.data.label ?? "");
                  })
                  .filter(Boolean);
                onCreatePermission(selectedNamespaces);
              }
            }}
          >
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

interface NamespacePathSelectorFlowProps {
  onCreatePermission?: (selectedPaths: string[]) => void;
}

export function NamespacePathSelectorFlow({
  onCreatePermission,
}: NamespacePathSelectorFlowProps) {
  return (
    <ReactFlowProvider>
      <NamespacePathFlow onCreatePermission={onCreatePermission} />
    </ReactFlowProvider>
  );
}
