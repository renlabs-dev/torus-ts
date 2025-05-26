"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect } from "react";
import { Handle, Position, useReactFlow } from "@xyflow/react";

import type {
  PermissionNodeData,
  NodeCreationResult,
} from "./permission-node-types";

interface PermissionNodeContainerProps {
  id: string;
  data: PermissionNodeData;
  children: ReactNode;
  hasSourceHandle?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createChildNodes?: (expression: any) => NodeCreationResult;
  shouldAutoCreateChildren?: boolean;
}

export function PermissionNodeContainer({
  id,
  data,
  children,
  hasSourceHandle = true,
  createChildNodes,
  shouldAutoCreateChildren = true,
}: PermissionNodeContainerProps) {
  const { setNodes, setEdges, getNodes } = useReactFlow();

  // Auto-create child nodes on mount if needed
  useEffect(() => {
    if (!shouldAutoCreateChildren || !createChildNodes) return;

    const currentNodes = getNodes();
    const hasChildren = currentNodes.some(
      (node) => node.id.startsWith(`${id}-`) || node.id === `${id}-base`,
    );

    if (!hasChildren) {
      const { nodes: childNodes, edges: childEdges } = createChildNodes(
        data.expression,
      );
      if (childNodes.length > 0) {
        setNodes((nodes) => {
          const existingIds = new Set(nodes.map((n) => n.id));
          const newNodes = childNodes.filter((n) => !existingIds.has(n.id));
          return nodes.concat(newNodes);
        });
        setEdges((edges) => {
          const existingIds = new Set(edges.map((e) => e.id));
          const newEdges = childEdges.filter((e) => !existingIds.has(e.id));
          return edges.concat(newEdges);
        });
      }
    }
  }, [
    id,
    data.expression,
    getNodes,
    createChildNodes,
    shouldAutoCreateChildren,
    setNodes,
    setEdges,
  ]);

  return (
    <div className="w-full">
      {children}

      <Handle type="target" position={Position.Top} />
      {hasSourceHandle && <Handle type="source" position={Position.Bottom} />}
    </div>
  );
}

// Hook to manage child nodes
export function useChildNodeManagement(id: string) {
  const { setNodes, setEdges, getEdges } = useReactFlow();

  const removeExistingChildNodes = useCallback(() => {
    const currentEdges = getEdges();

    const nodesToRemove = new Set<string>();
    const edgesToRemove = new Set<string>();

    const findChildren = (parentId: string) => {
      currentEdges.forEach((edge) => {
        if (edge.source === parentId) {
          nodesToRemove.add(edge.target);
          edgesToRemove.add(edge.id);
          findChildren(edge.target);
        }
      });
    };

    findChildren(id);

    setNodes((nodes) => nodes.filter((node) => !nodesToRemove.has(node.id)));
    setEdges((edges) => edges.filter((edge) => !edgesToRemove.has(edge.id)));
  }, [id, setNodes, setEdges, getEdges]);

  const updateNodeData = useCallback(
    <T extends PermissionNodeData>(updater: (data: T) => T) => {
      setNodes((nodes) =>
        nodes.map((node) => {
          if (node.id === id) {
            return {
              ...node,
              data: updater(node.data as T),
            };
          }
          return node;
        }),
      );
    },
    [id, setNodes],
  );

  const addChildNodes = useCallback(
    ({ nodes: childNodes, edges: childEdges }: NodeCreationResult) => {
      setNodes((nodes) => {
        const existingIds = new Set(nodes.map((n) => n.id));
        const newNodes = childNodes.filter((n) => !existingIds.has(n.id));
        return nodes.concat(newNodes);
      });
      setEdges((edges) => {
        const existingIds = new Set(edges.map((e) => e.id));
        const newEdges = childEdges.filter((e) => !existingIds.has(e.id));
        return edges.concat(newEdges);
      });
    },
    [setNodes, setEdges],
  );

  return {
    removeExistingChildNodes,
    updateNodeData,
    addChildNodes,
  };
}
