"use client";

import { Background, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { PermissionForm } from "./permission-form";

const initialNodes = [
  {
    id: "node-1",
    type: "textUpdater",
    position: { x: 100, y: 100 },
    data: { value: 123 },
  },
];

// Define nodeTypes here, using the imported PermissionForm
const nodeTypes = { textUpdater: PermissionForm };

export default function PermissionFlow() {
  return (
    <ReactFlow
      nodes={initialNodes}
      nodeTypes={nodeTypes}
      fitView
      style={{ width: "100%", height: "100%" }}
    >
      <Background />
    </ReactFlow>
  );
}
