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
import { InfoIcon, RotateCcw } from "lucide-react";

import { ConstraintNodeBoolean } from "./constraint-nodes/constraint-node-boolean";
import { ConstraintNodeNumber } from "./constraint-nodes/constraint-node-number";
import { ConstraintNodeBase } from "./constraint-nodes/constraint-node-base";
import { validateConstraintForm } from "./constraint-utils";
import type { ValidationResult } from "./constraint-utils";
import { constraintExamples } from "./constraint-data/constraint-data-examples";
import { constraintToNodes } from "./constraint-nodes/constraint-to-nodes";
import ConstraintControlsSheet from "./constraint-controls-sheet";
import { ConstraintSubmission } from "./constraint-submission";
import { api as trpcApi } from "~/trpc/react";
import type { BoolExprType } from "@torus-ts/dsl";
import { useTorus } from "@torus-ts/torus-provider";

import useAutoLayout from "./constraint-layout/use-auto-layout";
import type { LayoutOptions } from "./constraint-layout/use-auto-layout";

import {
  nodes as initialNodes,
  edges as initialEdges,
} from "./constraint-data/constraint-data-initial-elements";

import "@xyflow/react/dist/style.css";
import { ConstraintNodePermissionId } from "./constraint-nodes/constraint-node-permission-id";

const proOptions = {
  hideAttribution: true,
};

const defaultEdgeOptions = {
  type: "smoothstep",
  markerEnd: { type: MarkerType.ArrowClosed },
  pathOptions: { offset: 5 },
};

const nodeTypes = {
  permissionBoolean: ConstraintNodeBoolean,
  permissionNumber: ConstraintNodeNumber,
  permissionBase: ConstraintNodeBase,
  permissionId: ConstraintNodePermissionId,
};

/**
 * This example shows how you can automatically arrange your nodes after adding child nodes to your graph.
 */
function ConstraintFlow() {
  const { fitView } = useReactFlow();
  const { selectedAccount } = useTorus();

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedExample, setSelectedExample] = useState<string>("");
  const [selectedPermissionId, setSelectedPermissionId] = useState<string>("");
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: false,
    errors: [],
  });

  // Fetch permissions with constraints
  const { data: permissionsWithConstraints } =
    trpcApi.permission.allWithConstraints.useQuery();

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

  // Helper function to check if selected permission has an existing constraint
  const isEditingConstraint = useMemo(() => {
    if (!selectedPermissionId || !permissionsWithConstraints) return false;
    return permissionsWithConstraints.some(
      (item) =>
        item.permission.permission_id === selectedPermissionId &&
        item.constraint !== null,
    );
  }, [selectedPermissionId, permissionsWithConstraints]);

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

  // Load existing constraint when permission with constraint is selected
  useEffect(() => {
    if (!selectedPermissionId || !permissionsWithConstraints) return;

    // Find the permission with constraint
    const permissionWithConstraint = permissionsWithConstraints.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (item: any) =>
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        item.permission.permission_id === selectedPermissionId &&
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        item.constraint !== null,
    );

    if (permissionWithConstraint?.constraint) {
      try {
        // Deserialize the constraint
        const constraintBody = JSON.parse(
          permissionWithConstraint.constraint.body,
        ) as { json: unknown };
        // The stored JSON is actually just the BoolExpr body, not the full Constraint
        const deserializedBoolExpr = JSON.parse(
          JSON.stringify(constraintBody.json),
          (key, value: unknown) => {
            if (
              typeof value === "object" &&
              value !== null &&
              "type" in value &&
              "value" in value
            ) {
              const typedValue = value as { type: string; value: string };
              if (typedValue.type === "bigint") {
                return BigInt(typedValue.value);
              }
            }
            return value;
          },
        ) as BoolExprType;

        // Convert to nodes and edges - wrap the deserialized bool expression in proper Constraint structure
        const { nodes: newNodes, edges: newEdges } = constraintToNodes({
          permId: selectedPermissionId,
          body: deserializedBoolExpr,
        });

        // Update the permission ID in the new nodes
        const updatedNodes = newNodes.map((node) => {
          if (
            node.id === "permission-id" &&
            node.data.type === "permissionId"
          ) {
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
        setSelectedExample(""); // Clear selected example since we loaded from existing constraint
      } catch (error) {
        console.error("Failed to load existing constraint:", error);
      }
    }
  }, [selectedPermissionId, permissionsWithConstraints, setNodes, setEdges]);

  // Reset form when wallet changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setSelectedExample("");
    setSelectedPermissionId("");
  }, [selectedAccount?.address, setNodes, setEdges]);

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
      {validationResult.errors.length > 0 && (
        <div className="text-red-500 text-nowrap absolute bottom-4 left-4">
          {validationResult.errors.map((error, index) => (
            <div key={index} className="text-red-500 flex items-center gap-1">
              <InfoIcon className="h-4 w-4" />
              <span className="font-medium">
                {error.nodeId === "permission-id"
                  ? "Permission ID"
                  : error.nodeId === "constraint"
                    ? "Constraint"
                    : `Node ${error.nodeId}`}
                :
              </span>{" "}
              {error.message}, fix before submitting.
            </div>
          ))}
        </div>
      )}
      <div className="absolute bottom-4 right-4 z-50 flex gap-3 items-center">
        <Button
          variant="outline"
          className="shadow-lg"
          onClick={handleResetNodes}
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Reset Nodes
        </Button>
        <ConstraintControlsSheet
          selectedExample={selectedExample}
          onLoadExample={handleLoadExample}
          selectedPermissionId={selectedPermissionId}
          onPermissionIdChange={handlePermissionIdChange}
          isEditingConstraint={isEditingConstraint}
        />
        <ConstraintSubmission
          nodes={nodes}
          edges={edges}
          rootNodeId="root-boolean"
          selectedPermissionId={selectedPermissionId}
          isEditingConstraint={isEditingConstraint}
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
