import { useCallback } from "react";

import type { Node } from "@xyflow/react";

import type {
  DelegationTreeManager,
  PermissionId,
} from "@torus-network/sdk/chain";
import { namespaceToNodeId } from "@torus-network/sdk/chain";

import type { NamespacePathNodeData } from "./types";

interface UsePermissionSelectHandlerProps {
  nodes: Node<NamespacePathNodeData>[];
  selectedPaths: Set<string>;
  activePermission: PermissionId | "self" | null;
  delegationData: unknown;
  colorManager: unknown;
  treeManager: DelegationTreeManager | null;
  setSelectedPaths: (paths: Set<string>) => void;
  setActivePermission: (permission: PermissionId | "self" | null) => void;
  setNodes: (
    nodes:
      | Node<NamespacePathNodeData>[]
      | ((
          nodes: Node<NamespacePathNodeData>[],
        ) => Node<NamespacePathNodeData>[]),
  ) => void;
  getDescendantIds: (nodeId: string) => string[];
  updatePermissionBlocking: (permission: PermissionId | "self" | null) => void;
  updateEdgeStyles: (paths: Set<string>) => void;
}

export function usePermissionSelectHandler({
  nodes,
  selectedPaths,
  activePermission,
  delegationData,
  colorManager,
  setSelectedPaths,
  setActivePermission,
  setNodes,
  getDescendantIds,
  updatePermissionBlocking,
  updateEdgeStyles,
}: UsePermissionSelectHandlerProps) {
  const handlePermissionSelect = useCallback(
    (nodeId: string, permissionId: PermissionId | "self" | null) => {
      if (!delegationData || !colorManager) return;

      // Convert namespace path to node ID and find the node
      const targetNodeId = namespaceToNodeId(nodeId);
      const targetNode = nodes.find((n) => n.id === targetNodeId);
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

      // Update edge styles
      updateEdgeStyles(newSelectedPaths);
    },
    [
      delegationData,
      colorManager,
      nodes,
      selectedPaths,
      setSelectedPaths,
      setNodes,
      updateEdgeStyles,
      getDescendantIds,
      setActivePermission,
      updatePermissionBlocking,
      activePermission,
    ],
  );

  return handlePermissionSelect;
}
