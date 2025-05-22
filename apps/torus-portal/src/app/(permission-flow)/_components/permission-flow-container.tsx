"use client";

import type { DragEvent, CSSProperties, DragEventHandler } from "react";
import { useRef, useCallback } from "react";
import type { Node, Edge, OnConnect, Connection } from "@xyflow/react";
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Background,
} from "@xyflow/react";

import "@xyflow/react/dist/style.css";
import { DnDProvider, useDnD } from "./permission-flow-dnd-context";
import PermissionFlowSidebar from "./permission-flow-sidebar";

import "./index.css";

const initialNodes: Node[] = [
  {
    id: "1",
    type: "input",
    data: { label: "input node" },
    position: { x: 250, y: 5 },
  },
];

let id = 0;
const getId = () => `dndnode_${id++}`;

function DnDFlow() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { screenToFlowPosition } = useReactFlow();
  const [type] = useDnD();

  const onConnect: OnConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      if (!type) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const newNode: Node = {
        id: getId(),
        type,
        position,
        data: { label: `${type} node` },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, type, setNodes],
  );

  const onDragStart = (
    event: DragEvent<HTMLDivElement>,
    nodeType: string,
  ): void => {
    event.dataTransfer.setData("text/plain", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  const reactFlowStyle: CSSProperties = { backgroundColor: "#141414" };

  return (
    <div className="dndflow">
      <div className="reactflow-wrapper" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDragStart={onDragStart as DragEventHandler<HTMLDivElement>}
          onDrop={onDrop}
          onDragOver={onDragOver}
          fitView
          style={reactFlowStyle}
        >
          <Background />
        </ReactFlow>
      </div>
      <PermissionFlowSidebar />
    </div>
  );
}

export function PermissionFlowContainer() {
  return (
    <ReactFlowProvider>
      <DnDProvider>
        <DnDFlow />
      </DnDProvider>
    </ReactFlowProvider>
  );
}
