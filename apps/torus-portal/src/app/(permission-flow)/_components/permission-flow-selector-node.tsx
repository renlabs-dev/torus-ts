"use client";

import { useCallback } from "react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import type { Node, Edge, NodeProps } from "@xyflow/react";

interface SelectorNodeData {
  label: string;
}

export function SelectorNode({ id, data }: NodeProps) {
  const { setNodes, setEdges } = useReactFlow();

  const addChildNodes = useCallback(
    (count: number) => {
      const childNodes: Node[] = [];
      const connectingEdges: Edge[] = [];
      const baseId = Date.now();

      for (let i = 0; i < count; i++) {
        const childNodeId = `${baseId}-${i}`;

        const childNode: Node = {
          id: childNodeId,
          data: { label: `Node ${String(childNodeId)}` },
          position: { x: 0, y: 0 },
          style: { opacity: 0 },
        };

        const connectingEdge: Edge = {
          id: `${id}->${childNodeId}`,
          source: id,
          target: childNodeId,
          style: { opacity: 0 },
        };

        childNodes.push(childNode);
        connectingEdges.push(connectingEdge);
      }

      setNodes((nodes) => nodes.concat(childNodes));
      setEdges((edges) => edges.concat(connectingEdges));
    },
    [id, setNodes, setEdges],
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
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-blue-500"
      />
    </div>
  );
}
