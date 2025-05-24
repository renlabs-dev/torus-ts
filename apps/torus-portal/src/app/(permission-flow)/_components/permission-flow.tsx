"use client";

import { useEffect, useCallback, useMemo } from "react";

import type { Node, Edge, NodeMouseHandler, OnConnect } from "@xyflow/react";
import {
  ReactFlow,
  MarkerType,
  ReactFlowProvider,
  useReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  ConnectionLineType,
  Background,
} from "@xyflow/react";

import useAutoLayout from "./use-auto-layout";
import type { LayoutOptions } from "./use-auto-layout";

import {
  nodes as initialNodes,
  edges as initialEdges,
} from "./permission-flow-initial-elements";

import { getId } from "./permission-flow-utils";

import "@xyflow/react/dist/style.css";

const proOptions = {
  hideAttribution: true,
};

const defaultEdgeOptions = {
  type: "smoothstep",
  markerEnd: { type: MarkerType.ArrowClosed },
  pathOptions: { offset: 5 },
};

/**
 * This example shows how you can automatically arrange your nodes after adding child nodes to your graph.
 */
function ReactFlowAutoLayout() {
  const { fitView } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const layoutOptions: LayoutOptions = useMemo(
    () => ({
      algorithm: "d3-hierarchy",
      direction: "TB",
      spacing: [50, 50],
    }),
    [],
  );

  // this hook handles the computation of the layout once the elements or the direction changes
  useAutoLayout(layoutOptions);

  // this helper function adds a new node and connects it to the source node
  const addChildNode = useCallback(
    (parentNodeId: string) => {
      // create an incremental ID based on the number of elements already in the graph
      const childNodeId = getId();

      const childNode: Node = {
        id: childNodeId,
        data: { label: `Node ${nodes.length + 1}` },
        position: { x: 0, y: 0 }, // no need to pass a position as it is computed by the layout hook
        style: { opacity: 0 },
      };

      const connectingEdge: Edge = {
        id: `${parentNodeId}->${childNodeId}`,
        source: parentNodeId,
        target: childNodeId,
        style: { opacity: 0 },
      };

      setNodes((nodes) => nodes.concat([childNode]));
      setEdges((edges) => edges.concat([connectingEdge]));
    },
    [setNodes, setEdges, nodes.length],
  );

  // this function is called when a node in the graph is clicked
  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      // on click, we want to create a new node connecting the clicked node
      addChildNode(node.id);
    },
    [addChildNode],
  );

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );

  // every time our nodes change, we want to center the graph again
  useEffect(() => {
    void fitView();
  }, [nodes, fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={onNodeClick}
      nodesDraggable={false}
      defaultEdgeOptions={defaultEdgeOptions}
      connectionLineType={ConnectionLineType.SmoothStep}
      proOptions={proOptions}
      zoomOnDoubleClick={false}
    >
      <Background />
    </ReactFlow>
  );
}

const ReactFlowWrapper = () => {
  return (
    <ReactFlowProvider>
      <ReactFlowAutoLayout />
    </ReactFlowProvider>
  );
};

export default ReactFlowWrapper;
