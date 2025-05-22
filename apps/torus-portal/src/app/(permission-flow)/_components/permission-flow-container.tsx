"use client";

import type { DragEvent, CSSProperties, DragEventHandler } from "react";
import { useRef, useCallback, useState } from "react";
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
import CustomNode from "./permission-flow-custom-node";

const initialNodes: Node[] = [
  {
    id: "1",
    type: "input",
    data: { label: "input node" },
    position: { x: 250, y: 5 },
  },
];

const initBgColor = "#c9f1dd";

// Define the node types
const nodeTypes = {
  selectorNode: CustomNode,
};

let id = 0;
const getId = () => `dndnode_${id++}`;

function DnDFlow() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { screenToFlowPosition } = useReactFlow();
  const [type] = useDnD();

  // TEMP
  const [bgColor, setBgColor] = useState(initBgColor);

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

      let newNode: Node;

      if (type === "selectorNode") {
        const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
          const color = event.target.value;
          setBgColor(color);
          setNodes((nds) =>
            nds.map((node) => {
              if (node.id !== newNodeId) {
                return node;
              }

              return {
                ...node,
                data: {
                  ...node.data,
                  color,
                },
              };
            }),
          );
        };

        const newNodeId = getId();
        newNode = {
          id: newNodeId,
          type,
          position,
          data: { color: initBgColor, onChange },
        };
      } else {
        newNode = {
          id: getId(),
          type,
          position,
          data: { label: `${type} node` },
        };
      }

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, type, setNodes, setBgColor],
  );

  const onDragStart = (
    event: DragEvent<HTMLDivElement>,
    nodeType: string,
  ): void => {
    event.dataTransfer.setData("text/plain", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  const reactFlowStyle: CSSProperties = { backgroundColor: bgColor };

  return (
    <div className="flex flex-col md:flex-row h-full w-full grow text-black">
      <div className="flex-grow h-full" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDragStart={onDragStart as DragEventHandler<HTMLDivElement>}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
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
