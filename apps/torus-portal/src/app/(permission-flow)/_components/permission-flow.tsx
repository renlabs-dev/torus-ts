"use client";

import { useEffect, useCallback, useMemo } from "react";

import type { OnConnect } from "@xyflow/react";
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

import { SelectorNode } from "./permission-flow-selector-node";

import useAutoLayout from "./use-auto-layout";
import type { LayoutOptions } from "./use-auto-layout";

import {
  nodes as initialNodes,
  edges as initialEdges,
} from "./permission-flow-initial-elements";

import "@xyflow/react/dist/style.css";

const proOptions = {
  hideAttribution: true,
};

const defaultEdgeOptions = {
  type: "smoothstep",
  markerEnd: { type: MarkerType.ArrowClosed },
  pathOptions: { offset: 5 },
};

const nodeTypes = {
  selector: SelectorNode,
};

/**
 * This example shows how you can automatically arrange your nodes after adding child nodes to your graph.
 */
function ReactFlowAutoLayout() {
  const { fitView } = useReactFlow();

  const [nodes, onNodesChange] = useNodesState(initialNodes);
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
      nodeTypes={nodeTypes}
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
