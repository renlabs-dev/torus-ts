"use client";

import { useEffect, useCallback, useMemo, useState } from "react";

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
import { Button } from "@torus-ts/ui/components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui/components/select";

import PermissionNodeBoolean from "./permission-node-boolean";
import PermissionNodeNumber from "./permission-node-number";
import PermissionNodeBase from "./permission-node-base";
import { extractConstraintFromNodes } from "./permission-constraint-utils";
import { constraintValidationSchema } from "./permission-validation-schemas";
import { constraintExamples } from "./constraint-examples";
import { constraintToNodes } from "./constraint-to-nodes";

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
  type: "step",
  markerEnd: { type: MarkerType.ArrowClosed },
  pathOptions: { offset: 5 },
};

const nodeTypes = {
  permissionBoolean: PermissionNodeBoolean,
  permissionNumber: PermissionNodeNumber,
  permissionBase: PermissionNodeBase,
};

/**
 * This example shows how you can automatically arrange your nodes after adding child nodes to your graph.
 */
function ReactFlowAutoLayout() {
  const { fitView } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedExample, setSelectedExample] = useState<string>("");

  const handleLoadExample = useCallback(
    (exampleId: string) => {
      const example = constraintExamples.find((ex) => ex.id === exampleId);
      if (!example) return;

      const { nodes: newNodes, edges: newEdges } = constraintToNodes(
        example.constraint,
      );
      setNodes(newNodes);
      setEdges(newEdges);
      setSelectedExample(exampleId);
    },
    [setNodes, setEdges],
  );

  const handleCreateConstraint = useCallback(() => {
    try {
      // Extract constraint from the node tree
      const constraint = extractConstraintFromNodes(
        nodes,
        edges,
        "root-boolean",
      );

      if (!constraint) {
        console.error("Failed to extract constraint from nodes");
        return;
      }

      // Validate the constraint
      const validationResult = constraintValidationSchema.safeParse(constraint);

      if (!validationResult.success) {
        console.error("Constraint validation failed:", validationResult.error);
        return;
      }

      // Log the valid constraint with BigInt support
      console.log(
        "Created constraint:",
        JSON.stringify(
          constraint,
          (key, value) => {
            if (typeof value === "bigint") {
              return value.toString();
            }
            return value as unknown;
          },
          2,
        ),
      );
    } catch (error) {
      console.error("Error creating constraint:", error);
    }
  }, [nodes, edges]);

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
      <div className="absolute bottom-4 right-4 z-50 flex items-center gap-3">
        <Select value={selectedExample} onValueChange={handleLoadExample}>
          <SelectTrigger className="w-64 shadow-lg">
            <SelectValue placeholder="Load constraint example..." />
          </SelectTrigger>
          <SelectContent>
            {constraintExamples.map((example) => (
              <SelectItem key={example.id} value={example.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{example.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {example.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={handleCreateConstraint}
          size="lg"
          className="shadow-lg"
        >
          Create This Constraint
        </Button>
      </div>
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
