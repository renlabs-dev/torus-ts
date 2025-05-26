"use client";

import { useCallback } from "react";
import type { NodeProps } from "@xyflow/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui/components/select";
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
import { BoolExpr, CompOp } from "../../../../utils/dsl";
import type {
  BooleanNodeData,
  NodeCreationResult,
} from "./constraint-node-types";
import { createChildNodeId, createEdgeId } from "./constraint-node-types";
import {
  PermissionNodeContainer,
  useChildNodeManagement,
} from "./constraint-node-container";

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
            animated: true,
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
            animated: true,
          });

          edges.push({
            id: createEdgeId(id, rightId),
            source: id,
            target: rightId,
            animated: true,
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
            animated: true,
          });

          edges.push({
            id: createEdgeId(id, rightId),
            source: id,
            target: rightId,
            animated: true,
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
            animated: true,
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

  const shouldAutoCreate = true;

  return (
    <>
      <PermissionNodeContainer
        id={id}
        data={data}
        createChildNodes={createChildNodes}
        shouldAutoCreateChildren={shouldAutoCreate}
      >
        <Select value={data.expression.$} onValueChange={handleTypeChange}>
          <SelectTrigger
            id={`${id}-type`}
            className={` border transition-all pr-0 border-[#B1B1B7] duration-200 rounded-full
              [&>svg]:invisible ${data.expression.$ === "Not" && "bg-red-50 text-red-700"} ${
              data.expression.$ === "And" && "bg-blue-50 text-blue-700" } ${data.expression.$
              === "Or" && "bg-green-50 text-green-700"} ${ data.expression.$ === "CompExpr" &&
              "bg-purple-50 text-purple-700" } ${data.expression.$ === "Base" &&
              "bg-gray-50 text-gray-700"} `}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Not" className="hover:bg-red-50">
              <div className="flex items-center gap-2">
                <Ban className="h-4 w-4 text-red-600" />
                <span>NOT</span>
              </div>
            </SelectItem>
            <SelectItem value="And" className="hover:bg-blue-50">
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-blue-600" />
                <span>AND</span>
              </div>
            </SelectItem>
            <SelectItem value="Or" className="hover:bg-green-50">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-green-600" />
                <span>OR</span>
              </div>
            </SelectItem>
            <SelectItem value="CompExpr" className="hover:bg-purple-50">
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-purple-600" />
                <span>Comparison</span>
              </div>
            </SelectItem>
            <SelectItem value="Base" className="hover:bg-gray-50">
              <div className="flex items-center gap-2">
                <Workflow className="h-4 w-4 text-gray-600" />
                <span>Base Constraint</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </PermissionNodeContainer>
      {data.expression.$ === "CompExpr" && (
        <div className="absolute flex top-[3.2em] w-full justify-center gap-2">
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

// Wrapper to satisfy ReactFlow's NodeProps type requirement
export default function PermissionNodeBooleanWrapper(props: NodeProps) {
  return (
    <PermissionNodeBoolean id={props.id} data={props.data as BooleanNodeData} />
  );
}
