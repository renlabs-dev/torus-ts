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

import type { PermissionId } from "@torus-network/sdk/chain";

import { Badge } from "@torus-ts/ui/components/badge";
import { Button } from "@torus-ts/ui/components/button";
import { cn } from "@torus-ts/ui/lib/utils";

import type {
  LayoutOptions,
} from "~/app/_components/react-flow-layout/use-auto-layout";
import useAutoLayout from "~/app/_components/react-flow-layout/use-auto-layout";

import { DEFAULT_LAYOUT_OPTIONS, REACT_FLOW_PRO_OPTIONS } from "./constants";
import { NamespacePathNode } from "./namespace-path-node";
import type { PermissionColorManager } from "./permission-colors";
import type { NamespacePathFlowProps, NamespacePathNodeData } from "./types";
import { useDelegationTree } from "./use-delegation-tree";

function NamespacePathFlow({ onCreatePermission }: NamespacePathFlowProps) {
  const { fitView } = useReactFlow();
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [activePermission, setActivePermission] = useState<
    PermissionId | "self" | null
  >(null);
  const [colorManager, setColorManager] =
    useState<PermissionColorManager | null>(null);

  const { data: delegationData, isLoading, error } = useDelegationTree();

  const [nodes, setNodes, onNodesChange] = useNodesState<
    Node<NamespacePathNodeData>
  >([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    if (delegationData) {
      setNodes(delegationData.nodes);
      setEdges(delegationData.edges);
      setColorManager(delegationData.colorManager);
    }
  }, [delegationData, setNodes, setEdges]);

  const layoutOptions: LayoutOptions = useMemo(
    () => DEFAULT_LAYOUT_OPTIONS,
    [],
  );

  useAutoLayout(layoutOptions);

  // Helper function to update permission blocking based on active permission
  const updatePermissionBlocking = useCallback(
    (selectedPermissionId: PermissionId | "self" | null) => {
      if (!delegationData) return;

      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          const updatedPermissions = node.data.permissions.map((permission) => {
            // If no permission is selected, nothing is blocked
            if (!selectedPermissionId) {
              return { ...permission, blocked: false };
            }

            // Self permissions are never blocked
            if (permission.permissionId === "self") {
              return { ...permission, blocked: false };
            }

            // If self is the active permission, don't block other permissions
            if (selectedPermissionId === "self") {
              return { ...permission, blocked: false };
            }

            // Block permissions that don't match the selected one
            const blocked = permission.permissionId !== selectedPermissionId;
            return { ...permission, blocked };
          });

          return {
            ...node,
            data: {
              ...node.data,
              permissions: updatedPermissions,
            },
          };
        }),
      );
    },
    [delegationData, setNodes],
  );

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

  // Handle permission selection on nodes
  const handlePermissionSelect = useCallback(
    (nodeId: string, permissionId: PermissionId | "self" | null) => {
      if (!delegationData || !colorManager) return;

      // Find the node by label (nodeId is actually the namespace path)
      const targetNode = nodes.find((n) => n.data.label === nodeId);
      if (!targetNode) return;

      const newSelectedPaths = new Set(selectedPaths);
      const isDeselecting = permissionId === null;

      if (isDeselecting) {
        // Deselecting: remove this node and all its descendants
        newSelectedPaths.delete(targetNode.id);
        const descendants = getDescendantIds(targetNode.id);
        descendants.forEach((id) => newSelectedPaths.delete(id));

        // If no paths remain selected, clear the active permission
        if (newSelectedPaths.size === 0) {
          setActivePermission(null);
          updatePermissionBlocking(null);
        }
      } else {
        // Selecting: check if this permission is compatible with current selection
        if (
          activePermission &&
          activePermission !== permissionId &&
          activePermission !== "self" &&
          permissionId !== "self"
        ) {
          // Cannot mix two different non-self permissions
          return;
        }

        // Set or update active permission
        if (!activePermission) {
          setActivePermission(permissionId);
          updatePermissionBlocking(permissionId);
        } else if (activePermission === "self" && permissionId !== "self") {
          // If self is active and we're selecting a specific permission, switch to that permission
          setActivePermission(permissionId);
          updatePermissionBlocking(permissionId);
        } else if (activePermission !== "self" && permissionId === "self") {
          // If a specific permission is active and we're selecting self, keep the current permission
          // Self can always be added to any selection
        }

        // Add this node and all its descendants (if they have compatible permissions)
        newSelectedPaths.add(targetNode.id);
        const descendants = getDescendantIds(targetNode.id);
        descendants.forEach((descendantId) => {
          const descendantNode = nodes.find((n) => n.id === descendantId);
          if (descendantNode?.data.accessible) {
            // Determine the current active permission (could be the one we just set or the existing one)
            const currentActivePermission = activePermission ?? permissionId;

            // Check if descendant has compatible permissions
            const hasCompatiblePermission =
              descendantNode.data.permissions.some((perm) => {
                // Self permissions are always compatible
                if (perm.permissionId === "self") return true;

                // If the active permission is self, any permission is compatible
                if (currentActivePermission === "self") return true;

                // Otherwise, only the same permission is compatible
                return perm.permissionId === currentActivePermission;
              });

            if (hasCompatiblePermission) {
              newSelectedPaths.add(descendantId);
            }
          }
        });
      }

      setSelectedPaths(newSelectedPaths);

      // Update node selection states
      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          const isNodeSelected = newSelectedPaths.has(node.id);
          const wasNodeSelected = selectedPaths.has(node.id);
          let selectedPermissionForNode: PermissionId | "self" | null = null;

          if (isNodeSelected) {
            // For selected nodes, determine which permission they're using
            if (node.id === targetNode.id) {
              // This is the node we just clicked - use the permission we selected
              selectedPermissionForNode = permissionId;
            } else if (wasNodeSelected && node.data.selectedPermission) {
              // This node was already selected - keep its existing permission
              selectedPermissionForNode = node.data.selectedPermission;
            } else {
              // This is a newly selected node (descendant) - determine best permission
              const hasSelfPermission = node.data.permissions.some(
                (perm) => perm.permissionId === "self",
              );
              const hasCurrentPermission =
                permissionId &&
                node.data.permissions.some(
                  (perm) => perm.permissionId === permissionId,
                );
              const hasActivePermission =
                activePermission &&
                node.data.permissions.some(
                  (perm) => perm.permissionId === activePermission,
                );

              if (hasCurrentPermission) {
                // Priority 1: Use the currently selected permission if the node has it
                selectedPermissionForNode = permissionId;
              } else if (permissionId === "self" && hasSelfPermission) {
                // Priority 2: If we're specifically selecting self and node has it
                selectedPermissionForNode = "self";
              } else if (hasActivePermission) {
                // Priority 3: Fall back to the active permission if the node has it
                selectedPermissionForNode = activePermission;
              } else if (hasSelfPermission) {
                // Priority 4: Fallback to self if available
                selectedPermissionForNode = "self";
              } else {
                // Priority 5: Use the first available permission as last resort
                const firstAvailablePermission =
                  node.data.permissions[0]?.permissionId;
                selectedPermissionForNode = firstAvailablePermission ?? null;
              }
            }
          }

          return {
            ...node,
            data: {
              ...node.data,
              selectedPermission: selectedPermissionForNode,
            },
          };
        }),
      );

      // Update edge styles - simple white for selected, gray for unselected
      setEdges((currentEdges) =>
        currentEdges.map((edge) => {
          const sourceSelected = newSelectedPaths.has(edge.source);
          const targetSelected = newSelectedPaths.has(edge.target);
          const bothSelected = sourceSelected && targetSelected;

          return {
            ...edge,
            style: bothSelected
              ? {
                  stroke: "#ffffff",
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
    [
      selectedPaths,
      nodes,
      activePermission,
      delegationData,
      colorManager,
      setNodes,
      setEdges,
      getDescendantIds,
      updatePermissionBlocking,
    ],
  );

  const handleClearSelection = useCallback(() => {
    setSelectedPaths(new Set());
    setActivePermission(null);
    updatePermissionBlocking(null);

    setNodes((currentNodes) =>
      currentNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          selectedPermission: null,
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
  }, [setNodes, setEdges, updatePermissionBlocking]);

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
              {selectedCount} of {accessibleCount} selected
            </Badge>
            <Badge variant="secondary">
              {totalCount - accessibleCount} view-only
            </Badge>
          </div>

          {/* Permission colors reference panel */}
          {colorManager && (
            <div className="bg-muted/50 backdrop-blur-sm border rounded-sm p-2 space-y-1 max-w-md">
              <div className="text-xs font-medium text-muted-foreground">
                Permission Colors Reference:
              </div>
              <div className="flex flex-wrap gap-1">
                {(() => {
                  // Get all unique permissions from all nodes
                  const allPermissions = new Set<string>();
                  nodes.forEach((node) => {
                    node.data.permissions.forEach((perm) => {
                      allPermissions.add(perm.permissionId);
                    });
                  });

                  return Array.from(allPermissions).map((permissionId) => {
                    const typedPermissionId = permissionId as
                      | PermissionId
                      | "self";
                    const color =
                      colorManager.getColorForPermission(typedPermissionId);
                    const displayText =
                      colorManager.getPermissionDisplayText(typedPermissionId);
                    const isActive = activePermission === permissionId;

                    return (
                      <div
                        key={permissionId}
                        className={cn(
                          "flex items-center gap-1 px-2 py-1 rounded-sm text-xs font-mono border",
                          isActive
                            ? `${color.bg} ${color.border} ${color.text} border-2 font-semibold`
                            : "bg-muted/50 text-muted-foreground border-border",
                        )}
                      >
                        <div
                          className="w-3 h-3 border border-border/50 rounded-sm"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="font-semibold">{displayText}</span>
                        {isActive && (
                          <span className="ml-1 text-xs">ACTIVE</span>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
              <div className="text-xs text-muted-foreground">
                Select colored buttons on nodes to choose paths.{" "}
                {activePermission
                  ? "One permission + self-owned paths allowed."
                  : "Click any permission to start."}
              </div>
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
