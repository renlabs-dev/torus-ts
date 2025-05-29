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
import { RotateCcw } from "lucide-react";

import PermissionNodeBoolean from "./constraint-nodes/constraint-node-boolean";
import PermissionNodeNumber from "./constraint-nodes/constraint-node-number";
import PermissionNodeBase from "./constraint-nodes/constraint-node-base";
import PermissionNodePermissionId from "./constraint-nodes/constraint-node-permission-id";
import { validateConstraintForm } from "./constraint-utils";
import type { ValidationResult } from "./constraint-utils";
import { constraintExamples } from "./constraint-data/constraint-data-examples";
import { constraintToNodes } from "./constraint-nodes/constraint-to-nodes";
import ConstraintControlsSheet from "./constraint-controls-sheet";
import { ConstraintTutorialDialog } from "./constraint-tutorial-dialog";
import { ConstraintSubmission } from "./constraint-submission";

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
  const [selectedPermissionId, setSelectedPermissionId] = useState<string>("");
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: false,
    errors: [],
  });

  // Initialize permission ID from existing node
  useEffect(() => {
    const permissionIdNode = nodes.find((node) => node.id === "permission-id");
    if (
      permissionIdNode?.data.type === "permissionId" &&
      permissionIdNode.data.permissionId &&
      !selectedPermissionId
    ) {
      setSelectedPermissionId(permissionIdNode.data.permissionId);
    }
  }, [nodes, selectedPermissionId]);

  const handlePermissionIdChange = useCallback(
    (permissionId: string) => {
      setSelectedPermissionId(permissionId);

      // Update the permission ID node
      setNodes((currentNodes) =>
        currentNodes.map((node) => {
          if (
            node.id === "permission-id" &&
            node.data.type === "permissionId"
          ) {
            return {
              ...node,
              data: {
                ...node.data,
                permissionId,
              },
            };
          }
          return node;
        }),
      );
    },
    [setNodes],
  );

  const handleLoadExample = useCallback(
    (exampleId: string) => {
      const example = constraintExamples.find((ex) => ex.id === exampleId);
      if (!example) return;

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
              permissionId: selectedPermissionId,
            },
          };
        }
        return node;
      });

      setNodes(updatedNodes);
      setEdges(newEdges);
      setSelectedExample(exampleId);
    },
    [selectedPermissionId, setNodes, setEdges],
  );

  const handleResetNodes = useCallback(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setSelectedExample("");
    setSelectedPermissionId("");
  }, [setNodes, setEdges]);

  const layoutOptions: LayoutOptions = useMemo(
    () => ({
      algorithm: "d3-hierarchy",
      direction: "TB",
      spacing: [20, 50],
    }),
    [],
  );

  // this hook handles the computation of the layout once the elements or the direction changes
  useAutoLayout(layoutOptions);

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );

  // Sync permission ID state when nodes change (e.g., from node itself)
  useEffect(() => {
    const permissionIdNode = nodes.find((node) => node.id === "permission-id");
    if (permissionIdNode?.data.type === "permissionId") {
      const nodePermissionId = permissionIdNode.data.permissionId || "";
      if (nodePermissionId !== selectedPermissionId) {
        setSelectedPermissionId(nodePermissionId);
      }
    }
  }, [nodes, selectedPermissionId]);

  // Validate constraint whenever nodes change
  useEffect(() => {
    const result = validateConstraintForm(nodes, edges, "root-boolean");
    setValidationResult(result);
  }, [nodes, edges]);

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
      edgesFocusable={false}
      nodesConnectable={false}
      nodesFocusable={false}
      style={{
        backgroundColor: "#0E0E11",
      }}
    >
      <Background />
      <div className="absolute bottom-4 right-4 z-50 flex gap-3">
        <Button
          variant="outline"
          className="shadow-lg"
          onClick={handleResetNodes}
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Reset Nodes
        </Button>
        <ConstraintTutorialDialog />
        <ConstraintControlsSheet
          selectedExample={selectedExample}
          onLoadExample={handleLoadExample}
          selectedPermissionId={selectedPermissionId}
          onPermissionIdChange={handlePermissionIdChange}
          isSubmitDisabled={!validationResult.isValid}
          validationErrors={validationResult.errors}
          submitButton={
            <ConstraintSubmission
              nodes={nodes}
              edges={edges}
              rootNodeId="root-boolean"
              selectedPermissionId={selectedPermissionId}
              isSubmitDisabled={!validationResult.isValid}
            />
          }
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
