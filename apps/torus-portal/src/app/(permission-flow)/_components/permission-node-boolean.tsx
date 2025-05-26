"use client";

import { useCallback } from "react";
import type { NodeProps } from "@xyflow/react";
import { Label } from "@torus-ts/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui/components/select";
import { BoolExpr, CompOp } from "../../../utils/dsl";
import type {
  BooleanNodeData,
  NodeCreationResult,
} from "./permission-node-types";
import { createChildNodeId, createEdgeId } from "./permission-node-types";
import {
  PermissionNodeContainer,
  useChildNodeManagement,
} from "./permission-node-container";

interface PermissionNodeBooleanProps {
  id: string;
  data: BooleanNodeData;
}

export function PermissionNodeBoolean({
  id,
  data,
}: PermissionNodeBooleanProps) {
  const { removeExistingChildNodes, updateNodeData, addChildNodes } =
    useChildNodeManagement(id);

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
    (value: string) => {
      const type = value as BoolExpr["$"];

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
      updateNodeData<BooleanNodeData>((currentData) => ({
        ...currentData,
        expression: newExpression,
      }));

      // Create child nodes
      const childNodesResult = createChildNodes(newExpression);
      addChildNodes(childNodesResult);
    },
    [removeExistingChildNodes, updateNodeData, createChildNodes, addChildNodes],
  );

  const handleCompOpChange = useCallback(
    (value: string) => {
      if (data.expression.$ !== "CompExpr") return;

      const newOp = value as CompOp;

      updateNodeData<BooleanNodeData>((currentData) => ({
        ...currentData,
        expression: {
          ...currentData.expression,
          op: newOp,
        } as BoolExpr,
      }));
    },
    [data.expression, updateNodeData],
  );

  const shouldAutoCreate =
    data.expression.$ !== "Base" && data.expression.$ !== "CompExpr";

  return (
    <>
      <PermissionNodeContainer
        id={id}
        data={data}
        createChildNodes={createChildNodes}
        shouldAutoCreateChildren={shouldAutoCreate}
      >
        <Label htmlFor={`${id}-type`}>Boolean Type</Label>
        <Select value={data.expression.$} onValueChange={handleTypeChange}>
          <SelectTrigger id={`${id}-type`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Not">NOT</SelectItem>
            <SelectItem value="And">AND</SelectItem>
            <SelectItem value="Or">OR</SelectItem>
            <SelectItem value="CompExpr">Comparison</SelectItem>
            <SelectItem value="Base">Base Constraint</SelectItem>
          </SelectContent>
        </Select>
      </PermissionNodeContainer>
      {data.expression.$ === "CompExpr" && (
        <div className="absolute flex w-full top-[6.7em]">
          <Select value={data.expression.op} onValueChange={handleCompOpChange}>
            <SelectTrigger
              id={`${id}-op`}
              className="rounded-full border border-[#B1B1B7] text-xs"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={CompOp.Eq}>Equal (=)</SelectItem>
              <SelectItem value={CompOp.Gt}>Greater Than (&gt;)</SelectItem>
              <SelectItem value={CompOp.Lt}>Less Than (&lt;)</SelectItem>
              <SelectItem value={CompOp.Gte}>Greater or Equal (≥)</SelectItem>
              <SelectItem value={CompOp.Lte}>Less or Equal (≤)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </>
  );
}

// Wrapper to satisfy ReactFlow's NodeProps type requirement
export default function PermissionNodeBooleanWrapper(props: NodeProps) {
  return (
    <PermissionNodeBoolean id={props.id} data={props.data as BooleanNodeData} />
  );
}
