"use client";

import { useCallback, useEffect } from "react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import { BoolExpr, CompOp } from "../../../utils/dsl";
import type {
  BooleanNodeData,
  NodeCreationResult,
} from "./permission-node-types";
import { createChildNodeId, createEdgeId } from "./permission-node-types";

interface PermissionNodeBooleanProps {
  id: string;
  data: BooleanNodeData;
}

export function PermissionNodeBoolean({
  id,
  data,
}: PermissionNodeBooleanProps) {
  const { setNodes, setEdges, getNodes, getEdges } = useReactFlow();

  const removeExistingChildNodes = useCallback(() => {
    const currentEdges = getEdges();

    const nodesToRemove = new Set<string>();
    const edgesToRemove = new Set<string>();

    // Find all child nodes recursively
    const findChildren = (parentId: string) => {
      currentEdges.forEach((edge) => {
        if (edge.source === parentId) {
          nodesToRemove.add(edge.target);
          edgesToRemove.add(edge.id);
          findChildren(edge.target);
        }
      });
    };

    findChildren(id);

    setNodes((nodes) => nodes.filter((node) => !nodesToRemove.has(node.id)));
    setEdges((edges) => edges.filter((edge) => !edgesToRemove.has(edge.id)));
  }, [id, setNodes, setEdges, getEdges]);

  const createChildNodes = useCallback(
    (expression: BoolExpr): NodeCreationResult => {
      const nodes = [];
      const edges = [];

      switch (expression.$) {
        case "Not": {
          const childId = createChildNodeId(id, "body");
          nodes.push({
            id: childId,
            type: "permissionBoolean",
            data: {
              type: "boolean",
              expression: expression.body,
              label: "NOT Body",
            },
            position: { x: 0, y: 0 },
          });
          edges.push({
            id: createEdgeId(id, childId),
            source: id,
            target: childId,
          });
          break;
        }

        case "And":
        case "Or": {
          const leftId = createChildNodeId(id, "left");
          const rightId = createChildNodeId(id, "right");

          nodes.push({
            id: leftId,
            type: "permissionBoolean",
            data: {
              type: "boolean",
              expression: expression.left,
              label: "Left",
            },
            position: { x: 0, y: 0 },
          });

          nodes.push({
            id: rightId,
            type: "permissionBoolean",
            data: {
              type: "boolean",
              expression: expression.right,
              label: "Right",
            },
            position: { x: 0, y: 0 },
          });

          edges.push({
            id: createEdgeId(id, leftId),
            source: id,
            target: leftId,
          });

          edges.push({
            id: createEdgeId(id, rightId),
            source: id,
            target: rightId,
          });
          break;
        }

        case "CompExpr": {
          const leftId = createChildNodeId(id, "left");
          const rightId = createChildNodeId(id, "right");

          nodes.push({
            id: leftId,
            type: "permissionNumber",
            data: {
              type: "number",
              expression: expression.left,
              label: "Left Value",
            },
            position: { x: 0, y: 0 },
          });

          nodes.push({
            id: rightId,
            type: "permissionNumber",
            data: {
              type: "number",
              expression: expression.right,
              label: "Right Value",
            },
            position: { x: 0, y: 0 },
          });

          edges.push({
            id: createEdgeId(id, leftId),
            source: id,
            target: leftId,
          });

          edges.push({
            id: createEdgeId(id, rightId),
            source: id,
            target: rightId,
          });
          break;
        }

        case "Base": {
          const childId = createChildNodeId(id, "base");
          nodes.push({
            id: childId,
            type: "permissionBase",
            data: {
              type: "base",
              expression: expression.body,
              label: "Base Constraint",
            },
            position: { x: 0, y: 0 },
          });
          edges.push({
            id: createEdgeId(id, childId),
            source: id,
            target: childId,
          });
          break;
        }
      }

      return { nodes, edges };
    },
    [id],
  );

  const handleTypeChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const type = event.target.value as BoolExpr["$"];

      removeExistingChildNodes();

      let newExpression: BoolExpr;

      switch (type) {
        case "Not":
          newExpression = BoolExpr.not(
            BoolExpr.base({ $: "InactiveUnlessRedelegated" }),
          );
          break;
        case "And":
          newExpression = BoolExpr.and(
            BoolExpr.base({ $: "InactiveUnlessRedelegated" }),
            BoolExpr.base({ $: "InactiveUnlessRedelegated" }),
          );
          break;
        case "Or":
          newExpression = BoolExpr.or(
            BoolExpr.base({ $: "InactiveUnlessRedelegated" }),
            BoolExpr.base({ $: "InactiveUnlessRedelegated" }),
          );
          break;
        case "CompExpr":
          newExpression = BoolExpr.comp(
            CompOp.Eq,
            { $: "UIntLiteral", value: BigInt(0) },
            { $: "UIntLiteral", value: BigInt(0) },
          );
          break;
        case "Base":
          newExpression = BoolExpr.base({ $: "InactiveUnlessRedelegated" });
          break;
        default:
          return;
      }

      // Update current node data
      setNodes((nodes) =>
        nodes.map((node) => {
          if (node.id === id) {
            return {
              ...node,
              data: {
                ...data,
                expression: newExpression,
              },
            };
          }
          return node;
        }),
      );

      // Create child nodes
      const { nodes: childNodes, edges: childEdges } =
        createChildNodes(newExpression);
      setNodes((nodes) => nodes.concat(childNodes));
      setEdges((edges) => edges.concat(childEdges));
    },
    [id, data, removeExistingChildNodes, createChildNodes, setNodes, setEdges],
  );

  const handleCompOpChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      if (data.expression.$ !== "CompExpr") return;

      const newOp = event.target.value as CompOp;

      setNodes((nodes) =>
        nodes.map((node) => {
          if (node.id === id) {
            return {
              ...node,
              data: {
                ...data,
                expression: {
                  ...data.expression,
                  op: newOp,
                } as BoolExpr,
              },
            };
          }
          return node;
        }),
      );
    },
    [id, data, setNodes],
  );

  // Auto-create child nodes on mount if expression requires them
  useEffect(() => {
    const currentNodes = getNodes();
    const hasChildren = currentNodes.some((node) =>
      node.id.startsWith(`${id}-`),
    );

    if (
      !hasChildren &&
      data.expression.$ !== "Base" &&
      data.expression.$ !== "CompExpr"
    ) {
      const { nodes: childNodes, edges: childEdges } = createChildNodes(
        data.expression,
      );
      setNodes((nodes) => nodes.concat(childNodes));
      setEdges((edges) => edges.concat(childEdges));
    }
  }, [id, data.expression, getNodes, createChildNodes, setNodes, setEdges]);

  return (
    <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 min-w-[250px]">
      <div className="mb-2 font-bold text-blue-900">{data.label}</div>

      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Boolean Type
        </label>
        <select
          value={data.expression.$}
          onChange={handleTypeChange}
          className="w-full p-2 border border-gray-300 rounded bg-white text-gray-800"
        >
          <option value="Not">NOT</option>
          <option value="And">AND</option>
          <option value="Or">OR</option>
          <option value="CompExpr">Comparison</option>
          <option value="Base">Base Constraint</option>
        </select>
      </div>

      {data.expression.$ === "CompExpr" && (
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Operator
          </label>
          <select
            value={data.expression.op}
            onChange={handleCompOpChange}
            className="w-full p-2 border border-gray-300 rounded bg-white text-gray-800"
          >
            <option value={CompOp.Eq}>Equal (=)</option>
            <option value={CompOp.Gt}>Greater Than (&gt;)</option>
            <option value={CompOp.Lt}>Less Than (&lt;)</option>
            <option value={CompOp.Gte}>Greater or Equal (≥)</option>
            <option value={CompOp.Lte}>Less or Equal (≤)</option>
          </select>
        </div>
      )}

      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-blue-500"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-blue-600"
      />
    </div>
  );
}

// Wrapper to satisfy ReactFlow's NodeProps type requirement
export default function PermissionNodeBooleanWrapper(props: NodeProps) {
  return (
    <PermissionNodeBoolean id={props.id} data={props.data as BooleanNodeData} />
  );
}
