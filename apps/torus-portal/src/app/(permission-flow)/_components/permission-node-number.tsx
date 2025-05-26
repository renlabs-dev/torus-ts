"use client";

import { useCallback, useState } from "react";
import type { NodeProps } from "@xyflow/react";
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
import {
  PermissionNodeContainer,
  useChildNodeManagement,
} from "./permission-node-container";

interface PermissionNodeNumberProps {
  id: string;
  data: NumberNodeData;
}

export function PermissionNodeNumber({ id, data }: PermissionNodeNumberProps) {
  const { removeExistingChildNodes, updateNodeData, addChildNodes } =
    useChildNodeManagement(id);

  const [inputValue, setInputValue] = useState(() => {
    if (data.expression.$ === "UIntLiteral") {
      return data.expression.value.toString();
    }
    return "";
  });
  const [inputError, setInputError] = useState<string>("");
  const [accountError, setAccountError] = useState<string>("");

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

      updateNodeData<NumberNodeData>((currentData) => ({
        ...currentData,
        expression: newExpression,
      }));

      const childNodesResult = createChildNodes(newExpression);
      addChildNodes(childNodesResult);
    },
    [removeExistingChildNodes, updateNodeData, createChildNodes, addChildNodes],
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
        updateNodeData<NumberNodeData>((currentData) => ({
          ...currentData,
          expression: NumExpr.literal(BigInt(value)),
        }));
      }
    },
    [data.expression, updateNodeData],
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

      updateNodeData<NumberNodeData>((currentData) => {
        const expr = currentData.expression;

        if (expr.$ === "StakeOf" && field === "account") {
          return {
            ...currentData,
            expression: { ...expr, account: value },
          };
        } else if (
          (expr.$ === "WeightSet" || expr.$ === "WeightPowerFrom") &&
          (field === "from" || field === "to")
        ) {
          return {
            ...currentData,
            expression: { ...expr, [field]: value },
          };
        }
        return currentData;
      });
    },
    [updateNodeData],
  );

  const shouldAutoCreate =
    data.expression.$ === "Add" || data.expression.$ === "Sub";

  return (
    <PermissionNodeContainer
      id={id}
      data={data}
      createChildNodes={createChildNodes}
      shouldAutoCreateChildren={shouldAutoCreate}
    >
      <Select value={data.expression.$} onValueChange={handleTypeChange}>
        <SelectTrigger id={`${id}-type`}>
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

      {data.expression.$ === "UIntLiteral" && (
        <div className="mt-3">
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
        <div className="mt-3">
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
          <div className="mt-3">
            <Input
              id={`${id}-from`}
              type="text"
              value={data.expression.from || ""}
              onChange={(e) => handleAccountChange("from", e.target.value)}
              className={`w-full ${accountError ? "border-red-500" : ""}`}
              placeholder="From account ID"
            />
          </div>
          <div className="mt-3">
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
    </PermissionNodeContainer>
  );
}

// Wrapper to satisfy ReactFlow's NodeProps type requirement
export default function PermissionNodeNumberWrapper(props: NodeProps) {
  return (
    <PermissionNodeNumber id={props.id} data={props.data as NumberNodeData} />
  );
}
