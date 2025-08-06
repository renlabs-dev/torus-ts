"use client";

import "@xyflow/react/dist/style.css";

import { useCallback, useEffect, useMemo, useState } from "react";

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

import type { DelegationTreeManager } from "@torus-network/sdk/chain";
import { nodeIdToNamespace } from "@torus-network/sdk/chain";

import { Badge } from "@torus-ts/ui/components/badge";
import { Button } from "@torus-ts/ui/components/button";

import type {
  LayoutOptions,
} from "~/app/_components/react-flow-layout/use-auto-layout";
import useAutoLayout from "~/app/_components/react-flow-layout/use-auto-layout";

import { DEFAULT_LAYOUT_OPTIONS, REACT_FLOW_PRO_OPTIONS } from "./constants";
import { NamespacePathNode } from "./namespace-path-node";
import type { PermissionColorManager } from "./permission-colors";
import type {
  NamespacePathFlowProps,
  NamespacePathNodeData,
  PathWithPermission,
} from "./types";
import { useDelegationTree } from "./use-delegation-tree";
import { usePermissionBadges } from "./use-permission-badges";
import { usePermissionSelectHandler } from "./use-permission-select-handler";
import { usePermissionSelection } from "./use-permission-selection";

function NamespacePathFlow({ onCreatePermission }: NamespacePathFlowProps) {
  const { fitView } = useReactFlow();
  const [colorManager, setColorManager] =
    useState<PermissionColorManager | null>(null);
  const [treeManager, setTreeManager] = useState<DelegationTreeManager | null>(
    null,
  );

  const { data: delegationData, isLoading, error } = useDelegationTree();

  const [nodes, setNodes, onNodesChange] = useNodesState<
    Node<NamespacePathNodeData>
  >([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const {
    selectedPaths,
    activePermission,
    setSelectedPaths,
    setActivePermission,
    getDescendantIds,
    updatePermissionBlocking,
    updateEdgeStyles,
    clearSelection,
  } = usePermissionSelection({ nodes, edges, setNodes, setEdges, treeManager });

  useEffect(() => {
    if (delegationData) {
      setNodes(delegationData.nodes);
      setEdges(delegationData.edges);
      setColorManager(delegationData.colorManager);
      setTreeManager(delegationData.treeManager);
    }
  }, [delegationData, setNodes, setEdges]);

  const layoutOptions: LayoutOptions = useMemo(
    () => DEFAULT_LAYOUT_OPTIONS,
    [],
  );

  useAutoLayout(layoutOptions);

  const handlePermissionSelect = usePermissionSelectHandler({
    nodes,
    selectedPaths,
    activePermission,
    delegationData,
    colorManager,
    treeManager,
    setSelectedPaths,
    setActivePermission,
    setNodes,
    getDescendantIds,
    updatePermissionBlocking,
    updateEdgeStyles,
  });

  const handleClearSelection = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  const handleCreatePermission = useCallback(() => {
    if (selectedPaths.size > 0 && onCreatePermission) {
      const pathsWithPermissions = Array.from(selectedPaths)
        .map((nodeId) => {
          const node = nodes.find((n) => n.id === nodeId);
          if (!node?.data.selectedPermission) return null;

          return {
            path: nodeIdToNamespace(nodeId),
            permissionId:
              node.data.selectedPermission === "self"
                ? null
                : node.data.selectedPermission,
          };
        })
        .filter((item): item is PathWithPermission => item !== null);
      onCreatePermission(pathsWithPermissions);
    }
  }, [selectedPaths, nodes, onCreatePermission]);

  const renderPermissionBadges = usePermissionBadges({
    colorManager,
    activePermission,
    treeManager,
  });

  // Initial fit view when delegation data first loads
  useEffect(() => {
    if (delegationData && nodes.length > 0) {
      const timer = setTimeout(() => {
        void fitView({ padding: 0.1, duration: 800 });
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delegationData, fitView]); // Only trigger on initial delegation data load

  const accessibleCount = nodes.filter((node) => node.data.accessible).length;
  const totalCount = nodes.length;

  // Show loading state
  if (isLoading) {
    return (
      <div className="h-full w-full relative -top-14 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-lg font-medium">
            Loading namespace permissions...
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
        onNodeClick={undefined}
        nodeTypes={{
          namespacePath: (props) => (
            <NamespacePathNode
              {...props}
              onPermissionSelect={handlePermissionSelect}
            />
          ),
        }}
        nodesDraggable={false}
        nodesConnectable={false}
        nodesFocusable={true}
        edgesFocusable={false}
        proOptions={REACT_FLOW_PRO_OPTIONS}
        minZoom={0.6}
        maxZoom={1.7}
      >
        <Background />

        <Panel position="top-left" className="pt-10 space-y-2 z-50">
          <div className="flex space-x-2">
            <Badge variant="default">
              {selectedPaths.size} of {accessibleCount} selected
            </Badge>
            <Badge variant="secondary">
              {totalCount - accessibleCount} view-only
            </Badge>
          </div>
        </Panel>

        <Panel position="top-right" className="pt-10 space-y-2 z-50">
          {/* Permission colors reference panel */}
          {colorManager && (
            <div className="flex flex-wrap gap-1">
              {renderPermissionBadges()}
            </div>
          )}
        </Panel>

        <Panel
          position="bottom-right"
          className="flex gap-2 z-50 pb-4 shadow-lg"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearSelection}
            disabled={selectedPaths.size === 0}
          >
            Clear Selection
          </Button>
          <Button
            size="sm"
            disabled={selectedPaths.size === 0}
            onClick={handleCreatePermission}
          >
            Create Permission ({selectedPaths.size} paths)
          </Button>
        </Panel>

        {selectedPaths.size > 0 && (
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
  onCreatePermission?: (pathsWithPermissions: PathWithPermission[]) => void;
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
