"use client";

import { useCallback, useState } from "react";

import {
  ConstraintSelect,
  ConstraintInput,
  ConstraintSelectIconItem,
} from "./node-styled-components";
import { Hash, Clock, Coins, Plus, Minus } from "lucide-react";
import { NumExpr } from "~/utils/dsl";
import type { NumExprType } from "~/utils/dsl";
import type {
  NumberNodeData,
  NodeCreationResult,
} from "./constraint-node-types";
import { createChildNodeId, createEdgeId } from "./constraint-node-types";
import { uintSchema } from "../constraint-validation-schemas";
import {
  PermissionNodeContainer,
  useChildNodeManagement,
} from "./constraint-node-container";
import { SS58_SCHEMA } from "@torus-network/sdk";

interface PermissionNodeNumberProps {
  id: string;
  data: NumberNodeData;
}

export function ConstraintNodeNumber({ id, data }: PermissionNodeNumberProps) {
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
    (expression: NumExprType): NodeCreationResult => {
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
      const type = value as NumExprType["$"];

      removeExistingChildNodes();

      let newExpression: NumExprType;

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
    (field: "account", value: string) => {
      const validation = SS58_SCHEMA.safeParse(value);

      if (!validation.success && value.length > 0) {
        setAccountError(
          validation.error.errors[0]?.message ?? "Invalid account ID",
        );
      } else {
        setAccountError("");
      }

      updateNodeData<NumberNodeData>((currentData) => {
        const expr = currentData.expression;

        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (expr.$ === "StakeOf" && field === "account") {
          return {
            ...currentData,
            expression: { ...expr, account: value },
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
      <ConstraintSelect
        id={`${id}-type`}
        value={data.expression.$}
        onValueChange={handleTypeChange}
        className="w-fit"
        colorVariant={
          data.expression.$ === "UIntLiteral"
            ? "blue"
            : data.expression.$ === "BlockNumber"
              ? "purple"
              : data.expression.$ === "StakeOf"
                ? "green"
                : data.expression.$ === "Add"
                  ? "emerald"
                  : "red" // data.expression.$ === "Sub"
        }
      >
        <ConstraintSelectIconItem
          value="UIntLiteral"
          colorVariant="blue"
          icon={<Hash className="h-4 w-4 text-blue-600" />}
          label="Literal Value"
        />
        <ConstraintSelectIconItem
          value="BlockNumber"
          colorVariant="purple"
          icon={<Clock className="h-4 w-4 text-purple-600" />}
          label="Current Block"
        />
        <ConstraintSelectIconItem
          value="StakeOf"
          colorVariant="green"
          icon={<Coins className="h-4 w-4 text-green-600" />}
          label="Stake Of Account"
        />
        <ConstraintSelectIconItem
          value="Add"
          colorVariant="emerald"
          icon={<Plus className="h-4 w-4 text-emerald-600" />}
          label="Add"
        />
        <ConstraintSelectIconItem
          value="Sub"
          colorVariant="red"
          icon={<Minus className="h-4 w-4 text-red-600" />}
          label="Subtract"
        />
      </ConstraintSelect>
      {data.expression.$ !== "BlockNumber" && (
        <div className="text-white relative">↓</div>
      )}

      {data.expression.$ === "UIntLiteral" && (
        <ConstraintInput
          id={`${id}-value`}
          type="text"
          value={inputValue}
          onChange={(e) => handleValueChange(e.target.value)}
          placeholder="Enter a positive integer"
          hasError={!!inputError}
          errorMessage={inputError}
        />
      )}

      {data.expression.$ === "StakeOf" && (
        <ConstraintInput
          id={`${id}-account`}
          type="text"
          value={data.expression.account || ""}
          onChange={(e) => handleAccountChange("account", e.target.value)}
          placeholder="Enter account ID"
          hasError={!!accountError}
          errorMessage={accountError}
        />
      )}
    </PermissionNodeContainer>
  );
}
