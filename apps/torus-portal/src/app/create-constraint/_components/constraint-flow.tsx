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

import PermissionNodeBoolean from "./constraint-nodes/constraint-node-boolean";
import PermissionNodeNumber from "./constraint-nodes/constraint-node-number";
import PermissionNodeBase from "./constraint-nodes/constraint-node-base";
import PermissionNodePermissionId from "./constraint-nodes/constraint-node-permission-id";
import { extractConstraintFromNodes } from "./constraint-utils";
import { constraintValidationSchema } from "./constraint-validation-schemas";
import { constraintExamples } from "./constraint-data/constraint-data-examples";
import { constraintToNodes } from "./constraint-nodes/constraint-to-nodes";
import ConstraintControlsSheet from "./constraint-controls-sheet";

import useAutoLayout from "./constraint-layout/use-auto-layout";
import type { LayoutOptions } from "./constraint-layout/use-auto-layout";

import {
  nodes as initialNodes,
  edges as initialEdges,
} from "./constraint-data/constraint-data-initial-elements";

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
  permissionBoolean: PermissionNodeBoolean,
  permissionNumber: PermissionNodeNumber,
  permissionBase: PermissionNodeBase,
  permissionId: PermissionNodePermissionId,
};

/**
 * This example shows how you can automatically arrange your nodes after adding child nodes to your graph.
 */
function ConstraintFlow() {
  const { fitView } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedExample, setSelectedExample] = useState<string>("");

  const handleLoadExample = useCallback(
    (exampleId: string) => {
      const example = constraintExamples.find((ex) => ex.id === exampleId);
      if (!example) return;

      // Get current permission ID from the existing permission ID node
      const currentPermissionIdNode = nodes.find(
        (node) => node.id === "permission-id",
      );
      const currentPermissionId =
        currentPermissionIdNode?.data.type === "permissionId"
          ? currentPermissionIdNode.data.permissionId
          : "";

      const { nodes: newNodes, edges: newEdges } = constraintToNodes(
        example.constraint,
      );

      // Preserve the current permission ID in the new nodes
      const updatedNodes = newNodes.map((node) => {
        if (node.id === "permission-id" && node.data.type === "permissionId") {
          return {
            ...node,
            data: {
              ...node.data,
              permissionId: currentPermissionId,
            },
          };
        }
        return node;
      });

      setNodes(updatedNodes);
      setEdges(newEdges);
      setSelectedExample(exampleId);
    },
    [nodes, setNodes, setEdges],
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
      spacing: [10, 40],
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
      <div className="absolute bottom-4 right-4 z-50">
        <ConstraintControlsSheet
          selectedExample={selectedExample}
          onLoadExample={handleLoadExample}
          onCreateConstraint={handleCreateConstraint}
        />
      </div>
    </ReactFlow>
  );
}

const ConstraintFlowWrapper = () => {
  return (
    <ReactFlowProvider>
      <ConstraintFlow />
    </ReactFlowProvider>
  );
};

export default ConstraintFlowWrapper;
