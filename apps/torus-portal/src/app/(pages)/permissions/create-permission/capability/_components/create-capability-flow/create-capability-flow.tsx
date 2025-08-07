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

import type {
  DelegationTreeManager,
  PermissionId,
} from "@torus-network/sdk/chain";

import type { LayoutOptions } from "~/app/_components/react-flow-layout/use-auto-layout";
import useAutoLayout from "~/app/_components/react-flow-layout/use-auto-layout";

import { useDelegationTree } from "./create-capability-flow-hooks/use-delegation-tree";
import { usePermissionSelectHandler } from "./create-capability-flow-hooks/use-permission-select-handler";
import { usePermissionSelection } from "./create-capability-flow-hooks/use-permission-selection";
import { NamespacePathNode } from "./create-capability-flow-node";
import { ActionButtonsPanel } from "./create-capability-flow-panels/action-buttons-panel";
import { PermissionBadgesPanel } from "./create-capability-flow-panels/permission-badges-panel";
import { SelectedPathsPanel } from "./create-capability-flow-panels/selected-paths-panel";
import { StatsPanel } from "./create-capability-flow-panels/stats-panel";
import type {
  NamespacePathNodeData,
  PathWithPermission,
} from "./create-capability-flow-types";

interface NamespacePathFlowProps {
  onCreatePermission: (pathsWithPermissions: PathWithPermission[]) => void;
}

function CreateCapabilityFlow({ onCreatePermission }: NamespacePathFlowProps) {
  const { fitView } = useReactFlow();
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
    rootSelectedPaths,
    activePermission,
    setSelectedPaths,
    setRootSelectedPaths,
    setActivePermission,
    getDescendantIds,
    updatePermissionBlocking,
    clearSelection,
  } = usePermissionSelection({ nodes, edges, setNodes, treeManager });

  useEffect(() => {
    if (delegationData) {
      // Preserve existing selection states when updating nodes
      setNodes((currentNodes) => {
        // Create a map of existing selection states
        const existingSelections = new Map<
          string,
          PermissionId | "self" | null
        >();
        currentNodes.forEach((node) => {
          if (node.data.selectedPermission) {
            existingSelections.set(node.id, node.data.selectedPermission);
          }
        });

        // Merge new data with existing selections
        return delegationData.nodes.map((newNode) => {
          const existingSelection = existingSelections.get(newNode.id);
          return {
            ...newNode,
            data: {
              ...newNode.data,
              selectedPermission:
                existingSelection ?? newNode.data.selectedPermission,
            },
          };
        });
      });

      setEdges(delegationData.edges);
      setTreeManager(delegationData.treeManager);

      if (activePermission) {
        // Restore permission blocking
        updatePermissionBlocking(activePermission);
      }
    }
  }, [
    delegationData,
    setNodes,
    setEdges,
    activePermission,
    updatePermissionBlocking,
  ]);

  const layoutOptions: LayoutOptions = useMemo(
    () => ({
      algorithm: "d3-hierarchy",
      direction: "LR",
      spacing: [30, 40],
    }),
    [],
  );

  useAutoLayout(layoutOptions);

  const handlePermissionSelect = usePermissionSelectHandler({
    nodes,
    selectedPaths,
    rootSelectedPaths,
    activePermission,
    delegationData,
    treeManager,
    setSelectedPaths,
    setRootSelectedPaths,
    setActivePermission,
    setNodes,
    getDescendantIds,
    updatePermissionBlocking,
  });

  const handleClearSelection = useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  const handleCreatePermission = useCallback(() => {
    if (rootSelectedPaths.size > 0) {
      const pathsWithPermissions = Array.from(rootSelectedPaths)
        .map((nodeId) => {
          const node = nodes.find((n) => n.id === nodeId);
          if (!node?.data.selectedPermission) return null;

          return {
            path: nodeId,
            permissionId:
              node.data.selectedPermission === "self"
                ? null
                : node.data.selectedPermission,
          };
        })
        .filter((item): item is PathWithPermission => item !== null);
      onCreatePermission(pathsWithPermissions);
    }
  }, [rootSelectedPaths, nodes, onCreatePermission]);

  useEffect(() => {
    if (delegationData && nodes.length > 0) {
      const timer = setTimeout(() => {
        void fitView({ padding: 0.1, duration: 800 });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [delegationData, fitView, nodes.length]);

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
        proOptions={{ hideAttribution: true }}
        minZoom={0.6}
        maxZoom={1.7}
      >
        <Background />

        <Panel position="top-left" className="pt-10 space-y-2 z-50">
          <StatsPanel
            selectedCount={rootSelectedPaths.size}
            accessibleCount={accessibleCount}
            viewOnlyCount={totalCount - accessibleCount}
          />
        </Panel>

        <Panel position="top-right" className="pt-10 space-y-2 z-50">
          <PermissionBadgesPanel activePermission={activePermission} />
        </Panel>

        <Panel
          position="bottom-right"
          className="flex gap-2 z-50 pb-4 shadow-lg"
        >
          <ActionButtonsPanel
            selectedCount={rootSelectedPaths.size}
            onClearSelection={handleClearSelection}
            onCreatePermission={handleCreatePermission}
          />
        </Panel>

        {rootSelectedPaths.size > 0 && (
          <Panel
            position="bottom-left"
            className="bg-green-500/10 border-green-500/20 border rounded-sm p-2 z-50 shadow-lg"
          >
            <SelectedPathsPanel
              rootSelectedPaths={rootSelectedPaths}
              selectedPaths={selectedPaths}
              nodes={nodes}
            />
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}

export function CreateCapabilityFlowProvider({
  onCreatePermission,
}: NamespacePathFlowProps) {
  return (
    <ReactFlowProvider>
      <CreateCapabilityFlow onCreatePermission={onCreatePermission} />
    </ReactFlowProvider>
  );
}
