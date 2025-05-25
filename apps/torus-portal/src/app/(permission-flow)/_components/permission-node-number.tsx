"use client";

import { useCallback, useEffect, useState } from "react";
import { Handle, Position, useReactFlow } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import { Label } from "@torus-ts/ui/components/label";
import { Input } from "@torus-ts/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@torus-ts/ui/components/select";
import { NumExpr } from "~/utils/dsl";
import type {
  NumberNodeData,
  NodeCreationResult,
} from "./permission-node-types";
import { createChildNodeId, createEdgeId } from "./permission-node-types";
import { uintSchema, accountIdSchema } from "./permission-validation-schemas";

interface PermissionNodeNumberProps {
  id: string;
  data: NumberNodeData;
}

export function PermissionNodeNumber({ id, data }: PermissionNodeNumberProps) {
  const { setNodes, setEdges, getNodes, getEdges } = useReactFlow();
  const [inputValue, setInputValue] = useState(() => {
    if (data.expression.$ === "UIntLiteral") {
      return data.expression.value.toString();
    }
    return "";
  });
  const [inputError, setInputError] = useState<string>("");
  const [accountError, setAccountError] = useState<string>("");

  const removeExistingChildNodes = useCallback(() => {
    const currentEdges = getEdges();

    const nodesToRemove = new Set<string>();
    const edgesToRemove = new Set<string>();

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
    (expression: NumExpr): NodeCreationResult => {
      const nodes = [];
      const edges = [];

      switch (expression.$) {
        case "Add":
        case "Sub": {
          const leftId = createChildNodeId(id, "left");
          const rightId = createChildNodeId(id, "right");

          nodes.push({
            id: leftId,
            type: "permissionNumber",
            data: {
              type: "number",
              expression: expression.left,
              label: "Left Operand",
            },
            position: { x: 0, y: 0 },
          });

          nodes.push({
            id: rightId,
            type: "permissionNumber",
            data: {
              type: "number",
              expression: expression.right,
              label: "Right Operand",
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

        case "WeightSet":
        case "WeightPowerFrom": {
          // These have account parameters but no child nodes
          break;
        }

        case "StakeOf": {
          // Has account parameter but no child nodes
          break;
        }
      }

      return { nodes, edges };
    },
    [id],
  );

  const handleTypeChange = useCallback(
    (value: string) => {
      const type = value as NumExpr["$"];

      removeExistingChildNodes();

      let newExpression: NumExpr;

      switch (type) {
        case "UIntLiteral":
          newExpression = NumExpr.literal(0);
          setInputValue("0");
          setInputError("");
          break;
        case "BlockNumber":
          newExpression = NumExpr.blockNumber();
          break;
        case "StakeOf":
          newExpression = NumExpr.stakeOf("");
          setAccountError("");
          break;
        case "Add":
          newExpression = NumExpr.add(NumExpr.literal(0), NumExpr.literal(0));
          break;
        case "Sub":
          newExpression = NumExpr.sub(NumExpr.literal(0), NumExpr.literal(0));
          break;
        case "WeightSet":
          newExpression = NumExpr.weightSet("", "");
          setAccountError("");
          break;
        case "WeightPowerFrom":
          newExpression = NumExpr.weightPowerFrom("", "");
          setAccountError("");
          break;
        default:
          return;
      }

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

      const { nodes: childNodes, edges: childEdges } =
        createChildNodes(newExpression);
      setNodes((nodes) => nodes.concat(childNodes));
      setEdges((edges) => edges.concat(childEdges));
    },
    [id, data, removeExistingChildNodes, createChildNodes, setNodes, setEdges],
  );

  const handleValueChange = useCallback(
    (value: string) => {
      setInputValue(value);

      const validation = uintSchema.safeParse(value);

      if (!validation.success) {
        setInputError(validation.error.errors[0]?.message ?? "Invalid value");
        return;
      }

      setInputError("");

      if (data.expression.$ === "UIntLiteral") {
        setNodes((nodes) =>
          nodes.map((node) => {
            if (node.id === id) {
              return {
                ...node,
                data: {
                  ...data,
                  expression: NumExpr.literal(BigInt(value)),
                },
              };
            }
            return node;
          }),
        );
      }
    },
    [id, data, setNodes],
  );

  const handleAccountChange = useCallback(
    (field: "account" | "from" | "to", value: string) => {
      const validation = accountIdSchema.safeParse(value);

      if (!validation.success && value.length > 0) {
        setAccountError(
          validation.error.errors[0]?.message ?? "Invalid account ID",
        );
      } else {
        setAccountError("");
      }

      setNodes((nodes) =>
        nodes.map((node) => {
          if (node.id === id) {
            const expr = data.expression;

            if (expr.$ === "StakeOf" && field === "account") {
              return {
                ...node,
                data: {
                  ...data,
                  expression: { ...expr, account: value },
                },
              };
            } else if (
              (expr.$ === "WeightSet" || expr.$ === "WeightPowerFrom") &&
              (field === "from" || field === "to")
            ) {
              return {
                ...node,
                data: {
                  ...data,
                  expression: { ...expr, [field]: value },
                },
              };
            }
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
      (data.expression.$ === "Add" || data.expression.$ === "Sub")
    ) {
      const { nodes: childNodes, edges: childEdges } = createChildNodes(
        data.expression,
      );
      setNodes((nodes) => nodes.concat(childNodes));
      setEdges((edges) => edges.concat(childEdges));
    }
  }, [id, data.expression, getNodes, createChildNodes, setNodes, setEdges]);

  return (
    <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 min-w-[250px]">
      <div className="mb-2 font-bold text-green-900">{data.label}</div>

      <div className="mb-3">
        <Label
          htmlFor={`${id}-type`}
          className="text-sm font-medium text-gray-700 mb-1"
        >
          Number Type
        </Label>
        <Select value={data.expression.$} onValueChange={handleTypeChange}>
          <SelectTrigger id={`${id}-type`} className="w-full bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="UIntLiteral">Literal Value</SelectItem>
            <SelectItem value="BlockNumber">Block Number</SelectItem>
            <SelectItem value="StakeOf">Stake Of Account</SelectItem>
            <SelectItem value="Add">Add</SelectItem>
            <SelectItem value="Sub">Subtract</SelectItem>
            <SelectItem value="WeightSet">Weight Set</SelectItem>
            <SelectItem value="WeightPowerFrom">Weight Power From</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {data.expression.$ === "UIntLiteral" && (
        <div className="mb-3">
          <Label
            htmlFor={`${id}-value`}
            className="text-sm font-medium text-gray-700 mb-1"
          >
            Value
          </Label>
          <Input
            id={`${id}-value`}
            type="text"
            value={inputValue}
            onChange={(e) => handleValueChange(e.target.value)}
            className={`w-full ${inputError ? "border-red-500" : ""}`}
            placeholder="Enter a positive integer"
          />
          {inputError && (
            <p className="text-red-500 text-xs mt-1">{inputError}</p>
          )}
        </div>
      )}

      {data.expression.$ === "StakeOf" && (
        <div className="mb-3">
          <Label
            htmlFor={`${id}-account`}
            className="text-sm font-medium text-gray-700 mb-1"
          >
            Account ID
          </Label>
          <Input
            id={`${id}-account`}
            type="text"
            value={data.expression.account || ""}
            onChange={(e) => handleAccountChange("account", e.target.value)}
            className={`w-full ${accountError ? "border-red-500" : ""}`}
            placeholder="Enter account ID"
          />
          {accountError && (
            <p className="text-red-500 text-xs mt-1">{accountError}</p>
          )}
        </div>
      )}

      {(data.expression.$ === "WeightSet" ||
        data.expression.$ === "WeightPowerFrom") && (
        <>
          <div className="mb-3">
            <Label
              htmlFor={`${id}-from`}
              className="text-sm font-medium text-gray-700 mb-1"
            >
              From Account
            </Label>
            <Input
              id={`${id}-from`}
              type="text"
              value={data.expression.from || ""}
              onChange={(e) => handleAccountChange("from", e.target.value)}
              className={`w-full ${accountError ? "border-red-500" : ""}`}
              placeholder="From account ID"
            />
          </div>
          <div className="mb-3">
            <Label
              htmlFor={`${id}-to`}
              className="text-sm font-medium text-gray-700 mb-1"
            >
              To Account
            </Label>
            <Input
              id={`${id}-to`}
              type="text"
              value={data.expression.to || ""}
              onChange={(e) => handleAccountChange("to", e.target.value)}
              className={`w-full ${accountError ? "border-red-500" : ""}`}
              placeholder="To account ID"
            />
          </div>
          {accountError && (
            <p className="text-red-500 text-xs mt-1">{accountError}</p>
          )}
        </>
      )}

      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-green-500"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-green-600"
      />
    </div>
  );
}

// Wrapper to satisfy ReactFlow's NodeProps type requirement
export default function PermissionNodeNumberWrapper(props: NodeProps) {
  return (
    <PermissionNodeNumber id={props.id} data={props.data as NumberNodeData} />
  );
}
