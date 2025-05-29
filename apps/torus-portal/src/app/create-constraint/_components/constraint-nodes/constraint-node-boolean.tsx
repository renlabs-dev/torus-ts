"use client";

import { useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@torus-ts/ui/components/select";
import {
  ConstraintSelect,
  ConstraintSelectIconItem,
} from "./node-styled-components";
import {
  Ban,
  Plus,
  GitBranch,
  Scale,
  Equal,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  Workflow,
} from "lucide-react";
import { BoolExpr, CompOp } from "@torus-ts/dsl";
import type { BoolExprType } from "@torus-ts/dsl";
import type {
  BooleanNodeData,
  NodeCreationResult,
} from "./constraint-node-types";
import { createChildNodeId, createEdgeId } from "./constraint-node-types";
import {
  PermissionNodeContainer,
  useChildNodeManagement,
} from "./constraint-node-container";
import type { Edge, Node } from "@xyflow/react";

interface PermissionNodeBooleanProps {
  id: string;
  data: BooleanNodeData;
}

export function ConstraintNodeBoolean({
  id,
  data,
}: PermissionNodeBooleanProps) {
  const { removeExistingChildNodes, updateNodeData, addChildNodes } =
    useChildNodeManagement(id);

  const createChildNodes = useCallback(
    (expression: BoolExprType): NodeCreationResult => {
      const nodes: Node[] = [];
      const edges: Edge[] = [];

      const createChildNodesRecursive = (
        expr: BoolExprType,
        parentId: string,
      ): void => {
        switch (expr.$) {
          case "Not": {
            const childId = createChildNodeId(parentId, "body");
            nodes.push({
              id: childId,
              type: "permissionBoolean",
              data: {
                type: "boolean",
                expression: expr.body,
                label: "NOT Body",
              },
              position: { x: 0, y: 0 },
            });
            edges.push({
              id: createEdgeId(parentId, childId),
              source: parentId,
              target: childId,
              animated: true,
            });
            createChildNodesRecursive(expr.body, childId);
            break;
          }

          case "And":
          case "Or": {
            const leftId = createChildNodeId(parentId, "left");
            const rightId = createChildNodeId(parentId, "right");

            nodes.push({
              id: leftId,
              type: "permissionBoolean",
              data: {
                type: "boolean",
                expression: expr.left,
                label: "Left",
              },
              position: { x: 0, y: 0 },
            });

            nodes.push({
              id: rightId,
              type: "permissionBoolean",
              data: {
                type: "boolean",
                expression: expr.right,
                label: "Right",
              },
              position: { x: 0, y: 0 },
            });

            edges.push({
              id: createEdgeId(parentId, leftId),
              source: parentId,
              target: leftId,
              animated: true,
            });

            edges.push({
              id: createEdgeId(parentId, rightId),
              source: parentId,
              target: rightId,
              animated: true,
            });

            createChildNodesRecursive(expr.left, leftId);
            createChildNodesRecursive(expr.right, rightId);
            break;
          }

          case "CompExpr": {
            const leftId = createChildNodeId(parentId, "left");
            const rightId = createChildNodeId(parentId, "right");

            nodes.push({
              id: leftId,
              type: "permissionNumber",
              data: {
                type: "number",
                expression: expr.left,
                label: "Left Value",
              },
              position: { x: 0, y: 0 },
            });

            nodes.push({
              id: rightId,
              type: "permissionNumber",
              data: {
                type: "number",
                expression: expr.right,
                label: "Right Value",
              },
              position: { x: 0, y: 0 },
            });

            edges.push({
              id: createEdgeId(parentId, leftId),
              source: parentId,
              target: leftId,
              animated: true,
            });

            edges.push({
              id: createEdgeId(parentId, rightId),
              source: parentId,
              target: rightId,
              animated: true,
            });
            break;
          }

          case "Base": {
            const childId = createChildNodeId(parentId, "base");
            nodes.push({
              id: childId,
              type: "permissionBase",
              data: {
                type: "base",
                expression: expr.body,
                label: "Base Constraint",
              },
              position: { x: 0, y: 0 },
            });
            edges.push({
              id: createEdgeId(parentId, childId),
              source: parentId,
              target: childId,
              animated: true,
            });
            break;
          }
        }
      };

      createChildNodesRecursive(expression, id);
      return { nodes, edges };
    },
    [id],
  );

  const handleTypeChange = useCallback(
    (value: string) => {
      const type = value as BoolExprType["$"];

      removeExistingChildNodes();

      let newExpression: BoolExprType;

      switch (type) {
        case "Not":
          newExpression = BoolExpr.not(
            BoolExpr.base({
              $: "InactiveUnlessRedelegated",
              account: "",
              percentage: BigInt(0),
            }),
          );
          break;
        case "And":
          newExpression = BoolExpr.and(
            BoolExpr.base({
              $: "InactiveUnlessRedelegated",
              account: "",
              percentage: BigInt(0),
            }),
            BoolExpr.base({
              $: "InactiveUnlessRedelegated",
              account: "",
              percentage: BigInt(0),
            }),
          );
          break;
        case "Or":
          newExpression = BoolExpr.or(
            BoolExpr.base({
              $: "InactiveUnlessRedelegated",
              account: "",
              percentage: BigInt(0),
            }),
            BoolExpr.base({
              $: "InactiveUnlessRedelegated",
              account: "",
              percentage: BigInt(0),
            }),
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
          newExpression = BoolExpr.base({
            $: "InactiveUnlessRedelegated",
            account: "",
            percentage: BigInt(0),
          });
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
        } as BoolExprType,
      }));
    },
    [data.expression, updateNodeData],
  );

  const shouldAutoCreate = true;

  return (
    <>
      <PermissionNodeContainer
        id={id}
        data={data}
        createChildNodes={createChildNodes}
        shouldAutoCreateChildren={shouldAutoCreate}
      >
        <ConstraintSelect
          id={`${id}-type`}
          value={data.expression.$}
          onValueChange={handleTypeChange}
          colorVariant={
            data.expression.$ === "Not"
              ? "red"
              : data.expression.$ === "And"
                ? "blue"
                : data.expression.$ === "Or"
                  ? "green"
                  : data.expression.$ === "CompExpr"
                    ? "purple"
                    : "gray" // data.expression.$ === "Base"
          }
        >
          <ConstraintSelectIconItem
            value="Not"
            colorVariant="red"
            icon={<Ban className="h-4 w-4 text-red-600" />}
            label="NOT"
          />
          <ConstraintSelectIconItem
            value="And"
            colorVariant="blue"
            icon={<Plus className="h-4 w-4 text-blue-600" />}
            label="AND"
          />
          <ConstraintSelectIconItem
            value="Or"
            colorVariant="green"
            icon={<GitBranch className="h-4 w-4 text-green-600" />}
            label="OR"
          />
          <ConstraintSelectIconItem
            value="CompExpr"
            colorVariant="purple"
            icon={<Scale className="h-4 w-4 text-purple-600" />}
            label="Comparison"
          />
          <ConstraintSelectIconItem
            value="Base"
            colorVariant="gray"
            icon={<Workflow className="h-4 w-4 text-gray-600" />}
            label="Base Constraint"
          />
        </ConstraintSelect>
      </PermissionNodeContainer>
      {data.expression.$ === "CompExpr" && (
        <div className="absolute flex top-[3.35em] w-full justify-center gap-2">
          <Select value={data.expression.op} onValueChange={handleCompOpChange}>
            <SelectTrigger
              id={`${id}-op`}
              className="rounded-full border w-fit h-[2.4em] border-[#B1B1B7] [&>svg]:hidden"
            >
              <span>
                {data.expression.op === CompOp.Eq && "="}
                {data.expression.op === CompOp.Gt && ">"}
                {data.expression.op === CompOp.Lt && "<"}
                {data.expression.op === CompOp.Gte && ">="}
                {data.expression.op === CompOp.Lte && "<="}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={CompOp.Eq} className="hover:bg-blue-50">
                <div className="flex items-center gap-2">
                  <Equal className="h-3 w-3 text-blue-600" />
                  <span>Equal (=)</span>
                </div>
              </SelectItem>
              <SelectItem value={CompOp.Gt} className="hover:bg-green-50">
                <div className="flex items-center gap-2">
                  <ChevronUp className="h-3 w-3 text-green-600" />
                  <span>Greater Than (&gt;)</span>
                </div>
              </SelectItem>
              <SelectItem value={CompOp.Lt} className="hover:bg-red-50">
                <div className="flex items-center gap-2">
                  <ChevronDown className="h-3 w-3 text-red-600" />
                  <span>Less Than (&lt;)</span>
                </div>
              </SelectItem>
              <SelectItem value={CompOp.Gte} className="hover:bg-emerald-50">
                <div className="flex items-center gap-2">
                  <ChevronsUp className="h-3 w-3 text-emerald-600" />
                  <span>Greater or Equal (≥)</span>
                </div>
              </SelectItem>
              <SelectItem value={CompOp.Lte} className="hover:bg-orange-50">
                <div className="flex items-center gap-2">
                  <ChevronsDown className="h-3 w-3 text-orange-600" />
                  <span>Less or Equal (≤)</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </>
  );
}
