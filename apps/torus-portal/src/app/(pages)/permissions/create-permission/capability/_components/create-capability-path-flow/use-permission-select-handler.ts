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

/**
 * Determines the best permission to use for a node based on available permissions and priorities
 */
function determineBestPermission(
  node: Node<NamespacePathNodeData>,
  currentPermissionId: PermissionId | "self" | null,
  activePermission: PermissionId | "self" | null,
  treeManager: DelegationTreeManager | null,
): PermissionId | "self" | null {
  if (!treeManager) {
    // Fallback to original logic if no treeManager
    const permissions = node.data.permissions;
    const hasSelf = permissions.some((p) => p.permissionId === "self");
    const hasCurrent =
      currentPermissionId &&
      permissions.some((p) => p.permissionId === currentPermissionId);
    const hasActive =
      activePermission &&
      permissions.some((p) => p.permissionId === activePermission);

    if (hasCurrent) return currentPermissionId;
    if (currentPermissionId === "self" && hasSelf) return "self";
    if (hasActive) return activePermission;
    if (hasSelf) return "self";
    return permissions[0]?.permissionId ?? null;
  }

  // Use treeManager to get node permissions
  const nodePermissions = treeManager.getNodePermissions(node.id);
  const availablePermissions = Array.from(nodePermissions.keys());

  // Priority order:
  // 1. Current permission if available
  if (
    currentPermissionId &&
    availablePermissions.includes(currentPermissionId)
  ) {
    return currentPermissionId;
  }

  // 2. Self permission when specifically requested
  if (currentPermissionId === "self" && availablePermissions.includes("self")) {
    return "self";
  }

  // 3. Active permission if available
  if (activePermission && availablePermissions.includes(activePermission)) {
    return activePermission;
  }

  // 4. Self permission as fallback
  if (availablePermissions.includes("self")) {
    return "self";
  }

  // 5. First available permission
  return availablePermissions[0] ?? null;
}

/**
 * Checks if a permission is compatible with the current selection
 */
function isPermissionCompatible(
  permissionId: PermissionId | "self",
  activePermission: PermissionId | "self" | null,
): boolean {
  // No active permission means any permission is compatible
  if (!activePermission) return true;

  // Self permissions are always compatible
  if (permissionId === "self" || activePermission === "self") return true;

  // Otherwise, permissions must match
  return permissionId === activePermission;
}

export function usePermissionSelectHandler({
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
}: UsePermissionSelectHandlerProps) {
  const handlePermissionSelect = useCallback(
    (nodeId: string, permissionId: PermissionId | "self" | null) => {
      if (!delegationData || !colorManager) return;

      // Convert namespace path to node ID
      const targetNodeId = namespaceToNodeId(nodeId);

      // Use treeManager to get node if available, otherwise fallback to array.find
      const targetNode = treeManager?.getNode(targetNodeId)
        ? nodes.find((n) => n.id === targetNodeId)
        : nodes.find((n) => n.id === targetNodeId);

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
        // Check permission compatibility
        if (!isPermissionCompatible(permissionId, activePermission)) {
          return;
        }

        // Update active permission based on selection
        if (
          !activePermission ||
          (activePermission === "self" && permissionId !== "self")
        ) {
          setActivePermission(permissionId);
          updatePermissionBlocking(permissionId);
        }

        // Add target node
        newSelectedPaths.add(targetNode.id);

        // Add compatible descendants
        const descendants = getDescendantIds(targetNode.id);
        const currentActivePermission = activePermission ?? permissionId;

        descendants.forEach((descendantId) => {
          const descendantNode = nodes.find((n) => n.id === descendantId);
          if (!descendantNode?.data.accessible) return;

          // Check if descendant has compatible permissions using treeManager if available
          if (treeManager) {
            const descendantPermissions =
              treeManager.getNodePermissions(descendantId);
            const hasCompatible = Array.from(descendantPermissions.keys()).some(
              (perm) => isPermissionCompatible(perm, currentActivePermission),
            );

            if (hasCompatible) {
              newSelectedPaths.add(descendantId);
            }
          } else {
            // Fallback to original logic
            const hasCompatible = descendantNode.data.permissions.some((perm) =>
              isPermissionCompatible(
                perm.permissionId,
                currentActivePermission,
              ),
            );

            if (hasCompatible) {
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
            if (node.id === targetNode.id) {
              // This is the clicked node - use the selected permission
              selectedPermissionForNode = permissionId;
            } else if (wasNodeSelected && node.data.selectedPermission) {
              // Keep existing permission for already selected nodes
              selectedPermissionForNode = node.data.selectedPermission;
            } else {
              // Determine best permission for newly selected descendants
              selectedPermissionForNode = determineBestPermission(
                node,
                permissionId,
                activePermission,
                treeManager,
              );
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
      treeManager,
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
