"use client";

import { useCallback } from "react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import type { Node, Edge, NodeProps } from "@xyflow/react";

interface SelectorNodeData {
  label: string;
}

export function SelectorNode({ id, data }: NodeProps) {
  const { setNodes, setEdges } = useReactFlow();

  const removeExistingChildNodes = useCallback(() => {
    setNodes((nodes) =>
      nodes.filter((node) => !node.id.startsWith(`${id}-child-`)),
    );
    setEdges((edges) => edges.filter((edge) => !edge.id.startsWith(`${id}->`)));
  }, [id, setNodes, setEdges]);

  const addChildNodes = useCallback(
    (count: number) => {
      removeExistingChildNodes();

      const childNodes: Node[] = [];
      const connectingEdges: Edge[] = [];

      for (let i = 0; i < count; i++) {
        const childNodeId = `${id}-child-${i}`;

        const childNode: Node = {
          id: childNodeId,
          type: "selector",
          data: { label: `Node ${i + 1}` },
          position: { x: 0, y: 0 },
        };

        const connectingEdge: Edge = {
          id: `${id}->${childNodeId}`,
          source: id,
          target: childNodeId,
        };

        childNodes.push(childNode);
        connectingEdges.push(connectingEdge);
      }

      setNodes((nodes) => nodes.concat(childNodes));
      setEdges((edges) => edges.concat(connectingEdges));
    },
    [id, setNodes, setEdges, removeExistingChildNodes],
  );

  const handleSelectChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const value = event.target.value;
      if (value === "one") {
        addChildNodes(1);
      } else if (value === "two") {
        addChildNodes(2);
      }
      // Reset select to default
      event.target.value = "";
    },
    [addChildNodes],
  );

  return (
    <div className="bg-white border-2 border-gray-300 rounded-lg p-4 min-w-[200px]">
      <div className="mb-3 font-semibold text-gray-800">
        {(data as unknown as SelectorNodeData).label}
      </div>
      <select
        onChange={handleSelectChange}
        className="w-full p-2 border border-gray-300 rounded bg-white text-gray-800"
        defaultValue=""
      >
        <option value="" disabled>
          Choose action...
        </option>
        <option value="one">Create 1 node</option>
        <option value="two">Create 2 nodes</option>
      </select>
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-green-500"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-blue-500"
      />
    </div>
  );
}
