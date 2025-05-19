"use client";

import { useMemo } from "react";

import "@xyflow/react/dist/style.css";
import type {
  FormSchema,
  NumExprType,
  BoolExprType,
} from "./permission-form-schemas";
import type { baseConstraintSchema } from "./permission-form-schemas";
import type { Edge, Node, NodeTypes } from "@xyflow/react";
import { CompOp } from "~/utils/dsl";
import {
  Background,
  BackgroundVariant,
  Controls,
  Panel,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import type * as z from "zod";

// Custom node types
const nodeTypes: NodeTypes = {};

interface PermissionFlowVisualizerProps {
  formData: FormSchema;
}

export function PermissionFlowVisualizer({
  formData,
}: PermissionFlowVisualizerProps) {
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => generateFlowElements(formData),
    [formData],
  );

  const [nodes] = useNodesState(initialNodes);
  const [edges] = useEdgesState(initialEdges);

  return (
    <div style={{ width: "100%", height: "700px" }} className="text-black">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.5 }}
        attributionPosition="bottom-left"
      >
        <Controls />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Panel position="top-right">
          <div>Permission Structure Visualization</div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

function generateFlowElements(formData: FormSchema): {
  nodes: Node[];
  edges: Edge[];
} {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  let nodeCounter = 0;

  traverseBoolExpr(formData.body, null, 0, 50, 0);

  function traverseBoolExpr(
    expr: BoolExprType,
    parentId: string | null,
    x: number,
    y: number,
    depth: number,
  ): string {
    const horizontalSpacing = Math.max(300, 400 - depth * 50);
    const verticalSpacing = 160;
    const nodeId = `node_${nodeCounter++}`;
    let nodeLabel = "";

    switch (expr.type) {
      case "Not":
        nodeLabel = "NOT";
        nodes.push({
          id: nodeId,
          data: { label: nodeLabel },
          position: { x, y },
          style: {
            background: "#ffcccb",
            border: "1px solid #ff0000",
            borderRadius: "8px",
            padding: "10px",
            width: "100px",
            textAlign: "center",
          },
        });

        if (parentId) {
          edges.push({
            id: `edge_${parentId}_to_${nodeId}`,
            source: parentId,
            target: nodeId,
            animated: true,
            style: { strokeWidth: 2 },
            type: "smoothstep",
          });
        }

        traverseBoolExpr(expr.body, nodeId, x, y + verticalSpacing, depth + 1);
        return nodeId;

      case "And":
        nodeLabel = "AND";
        nodes.push({
          id: nodeId,
          data: { label: nodeLabel },
          position: { x, y },
          style: {
            background: "#c2f0c2",
            border: "1px solid #00a000",
            borderRadius: "8px",
            padding: "10px",
            width: "100px",
            textAlign: "center",
          },
        });

        // Add edge from parent to this node
        if (parentId) {
          edges.push({
            id: `edge_${parentId}_to_${nodeId}`,
            source: parentId,
            target: nodeId,
            animated: true,
            style: { strokeWidth: 2 },
            type: "smoothstep",
          });
        }

        // Process left and right expressions with better spacing
        traverseBoolExpr(
          expr.left,
          nodeId,
          x - horizontalSpacing,
          y + verticalSpacing,
          depth + 1,
        );
        traverseBoolExpr(
          expr.right,
          nodeId,
          x + horizontalSpacing,
          y + verticalSpacing,
          depth + 1,
        );

        return nodeId;

      case "Or":
        nodeLabel = "OR";
        nodes.push({
          id: nodeId,
          data: { label: nodeLabel },
          position: { x, y },
          style: {
            background: "#c2e1f5",
            border: "1px solid #0078d7",
            borderRadius: "8px",
            padding: "10px",
            width: "100px",
            textAlign: "center",
          },
        });

        // Add edge from parent to this node
        if (parentId) {
          edges.push({
            id: `edge_${parentId}_to_${nodeId}`,
            source: parentId,
            target: nodeId,
            animated: true,
            style: { strokeWidth: 2 },
            type: "smoothstep",
          });
        }

        // Process left and right expressions with better spacing
        traverseBoolExpr(
          expr.left,
          nodeId,
          x - horizontalSpacing,
          y + verticalSpacing,
          depth + 1,
        );
        traverseBoolExpr(
          expr.right,
          nodeId,
          x + horizontalSpacing,
          y + verticalSpacing,
          depth + 1,
        );

        return nodeId;

      case "CompExpr": {
        const opLabel = getComparisonOperatorLabel(expr.op);
        nodeLabel = `COMPARE: ${opLabel}`;
        nodes.push({
          id: nodeId,
          data: { label: nodeLabel },
          position: { x, y },
          style: {
            background: "#f5e8c2",
            border: "1px solid #d7a500",
            borderRadius: "8px",
            padding: "10px",
            width: "120px",
            textAlign: "center",
          },
        });

        // Add edge from parent to this node
        if (parentId) {
          edges.push({
            id: `edge_${parentId}_to_${nodeId}`,
            source: parentId,
            target: nodeId,
            animated: true,
            style: { strokeWidth: 2 },
            type: "smoothstep",
          });
        }

        // Create nodes for left and right numeric expressions
        const leftNumId = `node_${nodeCounter++}`;
        const rightNumId = `node_${nodeCounter++}`;

        nodes.push({
          id: leftNumId,
          data: { label: `LEFT: ${getNumExprLabel(expr.left)}` },
          position: {
            x: x - Math.max(200, horizontalSpacing * 0.7),
            y: y + verticalSpacing,
          },
          style: {
            background: "#e6e6e6",
            border: "1px solid #808080",
            borderRadius: "8px",
            padding: "8px",
            width: "150px",
            fontSize: "0.85em",
            textAlign: "center",
          },
        });

        nodes.push({
          id: rightNumId,
          data: { label: `RIGHT: ${getNumExprLabel(expr.right)}` },
          position: {
            x: x + Math.max(200, horizontalSpacing * 0.7),
            y: y + verticalSpacing,
          },
          style: {
            background: "#e6e6e6",
            border: "1px solid #808080",
            borderRadius: "8px",
            padding: "8px",
            width: "150px",
            fontSize: "0.85em",
            textAlign: "center",
          },
        });

        // Add edges
        edges.push({
          id: `edge_${nodeId}_to_left`,
          source: nodeId,
          target: leftNumId,
          animated: true,
          style: { strokeWidth: 2 },
          type: "smoothstep",
        });

        edges.push({
          id: `edge_${nodeId}_to_right`,
          source: nodeId,
          target: rightNumId,
          animated: true,
          style: { strokeWidth: 2 },
          type: "smoothstep",
        });

        return nodeId;
      }

      case "Base": {
        const constraintLabel = getBaseConstraintLabel(expr.body);
        nodeLabel = `BASE: ${constraintLabel}`;
        nodes.push({
          id: nodeId,
          data: { label: nodeLabel },
          position: { x, y },
          style: {
            background: "#e5d4e8",
            border: "1px solid #8a3996",
            borderRadius: "8px",
            padding: "10px",
            width: "180px",
            textAlign: "center",
          },
        });

        // Add edge from parent to this node
        if (parentId) {
          edges.push({
            id: `edge_${parentId}_to_${nodeId}`,
            source: parentId,
            target: nodeId,
            animated: true,
            style: { strokeWidth: 2 },
            type: "smoothstep",
          });
        }

        return nodeId;
      }

      default:
        nodeLabel = "UNKNOWN";
        nodes.push({
          id: nodeId,
          data: { label: nodeLabel },
          position: { x, y },
          style: {
            background: "#f0f0f0",
            border: "1px solid #808080",
            borderRadius: "8px",
            padding: "10px",
            width: "100px",
            textAlign: "center",
          },
        });

        if (parentId) {
          edges.push({
            id: `edge_${parentId}_to_${nodeId}`,
            source: parentId,
            target: nodeId,
            animated: true,
            style: { strokeWidth: 2 },
            type: "smoothstep",
          });
        }

        return nodeId;
    }
  }

  return { nodes, edges };
}

function getComparisonOperatorLabel(op: CompOp) {
  switch (op) {
    case CompOp.Gt:
      return ">";
    case CompOp.Lt:
      return "<";
    case CompOp.Gte:
      return ">=";
    case CompOp.Lte:
      return "<=";
    case CompOp.Eq:
      return "=";
    default:
      return "?";
  }
}

function getNumExprLabel(expr: NumExprType) {
  switch (expr.type) {
    case "UIntLiteral":
      return `Literal: ${expr.value}`;
    case "BlockNumber":
      return "Block Number";
    case "StakeOf":
      return `Stake of: ${expr.account}`;
    case "Add":
      return "+";
    case "Sub":
      return "-";
    case "WeightSet":
      return `Weight Set: ${expr.from} -> ${expr.to}`;
    case "WeightPowerFrom":
      return `Weight Power: ${expr.from} -> ${expr.to}`;
    default:
      return "Unknown";
  }
}

function getBaseConstraintLabel(
  constraint: z.infer<typeof baseConstraintSchema>,
): string {
  switch (constraint.type) {
    case "MaxDelegationDepth":
      return "Max Delegation Depth";
    case "PermissionExists":
      return `Permission Exists: ${constraint.pid}`;
    case "PermissionEnabled":
      return `Permission Enabled: ${constraint.pid}`;
    case "RateLimit":
      return "Rate Limit";
    case "InactiveUnlessRedelegated":
      return "Inactive Unless Redelegated";
    default:
      return "Unknown Constraint";
  }
}
