"use client";

import "@xyflow/react/dist/style.css";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useState } from "react";

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

import type { DelegationTreeManager } from "@torus-network/sdk/chain";

import { useTorus } from "@torus-ts/torus-provider";

import LoadingPage from "~/app/(pages)/loading";
import type { LayoutOptions } from "~/app/_components/react-flow-layout/use-auto-layout";
import useAutoLayout from "~/app/_components/react-flow-layout/use-auto-layout";

import { useDelegationTree } from "./create-capability-flow-hooks/use-delegation-tree";
import { useEdgeStyling } from "./create-capability-flow-hooks/use-edge-styling";
import { usePermissionSelectHandler } from "./create-capability-flow-hooks/use-permission-select-handler";
import { usePermissionSelection } from "./create-capability-flow-hooks/use-permission-selection";
import { NamespacePathNode } from "./create-capability-flow-node";
import { ActionButtonsPanel } from "./create-capability-flow-panels/action-buttons-panel";
import { PermissionBadgesPanel } from "./create-capability-flow-panels/permission-badges-panel";
import { SelectedPathsPanel } from "./create-capability-flow-panels/selected-paths-panel";
import { StatsPanel } from "./create-capability-flow-panels/stats-panel";
import type {
  CapabilityFlowRef,
  NamespacePathNodeData,
  PathWithPermission,
} from "./create-capability-flow-types";

interface NamespacePathFlowProps {
  onCreatePermission: (pathsWithPermissions: PathWithPermission[]) => void;
}

const CreateCapabilityFlow = forwardRef<CapabilityFlowRef, NamespacePathFlowProps>(
  function CreateCapabilityFlow({ onCreatePermission }, ref) {
  const { fitView } = useReactFlow();
  const { selectedAccount, isAccountConnected, isInitialized } = useTorus();
  const queryClient = useQueryClient();
  const [treeManager, setTreeManager] = useState<DelegationTreeManager | null>(
    null,
  );

  const {
    data: delegationData,
    isLoading,
    error,
    isFetching,
  } = useDelegationTree();

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

  const { getStyledEdges } = useEdgeStyling({
    nodes,
    edges,
    selectedPaths,
  });

  useEffect(() => {
    clearSelection();
    setNodes(() => []);
    setEdges(() => []);
    setTreeManager(null);
    void queryClient.invalidateQueries({ queryKey: ["delegationTree"] });
  }, [
    selectedAccount?.address,
    clearSelection,
    queryClient,
    setNodes,
    setEdges,
  ]);

  useEffect(() => {
    if (delegationData) {
      setNodes(() => [...delegationData.nodes]);
      setEdges(() => [...delegationData.edges]);
      setTreeManager(delegationData.treeManager);
    }
  }, [delegationData, setNodes, setEdges]);

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

  // Expose clearSelection function through ref
  useImperativeHandle(ref, () => ({
    clearSelection: handleClearSelection,
  }), [handleClearSelection]);

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

  if (isLoading || isFetching || !isInitialized) {
    return <LoadingPage />;
  }

  if (!isAccountConnected) {
    return (
      <div className="h-full w-full relative -top-14 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-lg font-medium">No wallet selected</div>
          <div className="text-sm text-muted-foreground">
            Please connect your wallet to view your paths.
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
      <style jsx>{`
        @keyframes dash {
          from {
            stroke-dashoffset: 12;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
      <ReactFlow
        key={selectedAccount?.address}
        nodes={nodes}
        edges={getStyledEdges()}
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
          <PermissionBadgesPanel
            activePermission={activePermission}
            nodes={nodes}
          />
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
          <Panel position="bottom-left">
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
});

export const CreateCapabilityFlowProvider = forwardRef<CapabilityFlowRef, NamespacePathFlowProps>(
  function CreateCapabilityFlowProvider({ onCreatePermission }, ref) {
    return (
      <ReactFlowProvider>
        <CreateCapabilityFlow ref={ref} onCreatePermission={onCreatePermission} />
      </ReactFlowProvider>
    );
  }
);
