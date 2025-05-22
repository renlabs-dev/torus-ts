import React, { memo } from "react";
import type { Connection } from "@xyflow/react";
import { Handle, Position } from "@xyflow/react";

interface CustomNodeProps {
  data: any;
  isConnectable: boolean;
}

function CustomNode({ data, isConnectable }: CustomNodeProps) {
  return (
    <div className="bg-white radius-2xl p-4 flex flex-col">
      <Handle
        type="target"
        position={Position.Left}
        onConnect={(params: Connection) =>
          console.log("handle onConnect", params)
        }
        isConnectable={isConnectable}
      />
      <div>
        Custom Color Picker Node: <strong>{data.color}</strong>
      </div>
      <input
        className="nodrag"
        type="color"
        onChange={data.onChange}
        defaultValue={data.color}
      />
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
      />
    </div>
  );
}

export default memo(CustomNode);
