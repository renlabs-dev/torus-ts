import { useCallback, useState } from "react";

import type { Edge, Node } from "@xyflow/react";

import type {
  DelegationTreeManager,
  PermissionId,
} from "@torus-network/sdk/chain";

import { EDGE_COLORS, EDGE_WIDTHS } from "./constants";
import type { NamespacePathNodeData } from "./types";

interface UsePermissionSelectionProps {
  nodes: Node<NamespacePathNodeData>[];
  edges: Edge[];
  setNodes: React.Dispatch<React.SetStateAction<Node<NamespacePathNodeData>[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  treeManager?: DelegationTreeManager | null;
}

export function usePermissionSelection({
  // nodes,
  edges,
  setNodes,
  setEdges,
  treeManager,
}: UsePermissionSelectionProps) {
  // Visual selection for UI feedback (includes descendants)
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  // Root paths that were actually clicked by the user (for form submission)
  const [rootSelectedPaths, setRootSelectedPaths] = useState<Set<string>>(new Set());
  const [activePermission, setActivePermission] = useState<
    PermissionId | "self" | null
  >(null);

  // Get all descendant node IDs recursively using the tree manager if available
  const getDescendantIds = useCallback(
    (nodeId: string): string[] => {
      if (treeManager) {
        // Use the tree manager's built-in method for getting children
        const descendants: string[] = [];
        const queue = [nodeId];

        while (queue.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const currentId = queue.shift()!;
          const children = treeManager.getChildren(currentId);
          descendants.push(...children);
          queue.push(...children);
        }

        return descendants;
      } else {
        // Fallback to edge-based traversal
        const descendants: string[] = [];
        const queue = [nodeId];

        while (queue.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          const currentId = queue.shift()!;
          const childEdges = edges.filter((edge) => edge.source === currentId);
          for (const edge of childEdges) {
            descendants.push(edge.target);
            queue.push(edge.target);
          }
        }

        return descendants;
      }
    },
    [edges, treeManager],
  );

  // Update permission blocking based on active permission
  const updatePermissionBlocking = useCallback(
    (selectedPermissionId: PermissionId | "self" | null) => {
      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          const updatedPermissions = node.data.permissions.map((permission) => {
            if (!selectedPermissionId) {
              return { ...permission, blocked: false };
            }

            if (permission.permissionId === "self") {
              return { ...permission, blocked: false };
            }

            if (selectedPermissionId === "self") {
              return { ...permission, blocked: false };
            }

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
    [setNodes],
  );

  // Update edge styles
  const updateEdgeStyles = useCallback(
    (newSelectedPaths: Set<string>) => {
      setEdges((currentEdges) =>
        currentEdges.map((edge) => {
          const sourceSelected = newSelectedPaths.has(edge.source);
          const targetSelected = newSelectedPaths.has(edge.target);
          const bothSelected = sourceSelected && targetSelected;

          return {
            ...edge,
            style: bothSelected
              ? {
                  stroke: EDGE_COLORS.selected,
                  strokeWidth: EDGE_WIDTHS.selected,
                }
              : {
                  stroke: EDGE_COLORS.default,
                  strokeWidth: EDGE_WIDTHS.default,
                },
          };
        }),
      );
    },
    [setEdges],
  );

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedPaths(new Set());
    setRootSelectedPaths(new Set());
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

    updateEdgeStyles(new Set());
  }, [setNodes, updatePermissionBlocking, updateEdgeStyles]);

  return {
    selectedPaths, // Visual selection (includes descendants)
    rootSelectedPaths, // Only root paths clicked by user
    activePermission,
    setSelectedPaths,
    setRootSelectedPaths,
    setActivePermission,
    getDescendantIds,
    updatePermissionBlocking,
    updateEdgeStyles,
    clearSelection,
  };
}
