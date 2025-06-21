"use client";

import { useCallback, useState } from "react";
import {
  ConstraintSelect,
  ConstraintInput,
  ConstraintSelectIconItem,
} from "./node-styled-components";
import { CheckCircle, Play, Pause } from "lucide-react";
import type { BaseConstraintType } from "@torus-ts/dsl";
import { BaseConstraint } from "@torus-ts/dsl";
import type { BaseNodeData } from "./constraint-node-types";
import {
  PermissionNodeContainer,
  useChildNodeManagement,
} from "./constraint-node-container";
import { H256_HEX } from "@torus-network/sdk";
import { Badge } from "@torus-ts/ui/components/badge";

interface PermissionNodeBaseProps {
  id: string;
  data: BaseNodeData;
}

export function ConstraintNodeBase({ id, data }: PermissionNodeBaseProps) {
  const { removeExistingChildNodes, updateNodeData } =
    useChildNodeManagement(id);

  const [permissionId, setPermissionId] = useState(() => {
    const expr = data.expression;
    if (expr.$ === "PermissionExists" || expr.$ === "PermissionEnabled") {
      return expr.pid || "";
    }
    return "";
  });

  const [account, setAccount] = useState(() => {
    const expr = data.expression;
    if (expr.$ === "InactiveUnlessRedelegated") {
      return expr.account || "";
    }
    return "";
  });

  const [percentage, setPercentage] = useState(() => {
    const expr = data.expression;
    if (expr.$ === "InactiveUnlessRedelegated") {
      return expr.percentage.toString() || "0";
    }
    return "0";
  });
  const [permissionIdError, setPermissionIdError] = useState<string>("");
  const [percentageError, setPercentageError] = useState<string>("");

  const handleTypeChange = useCallback(
    (value: string) => {
      const type = value as BaseConstraintType["$"];

      removeExistingChildNodes();

      let newExpression: BaseConstraintType;

      switch (type) {
        case "PermissionExists":
          newExpression = BaseConstraint.permissionExists("");
          setPermissionId("");
          setPermissionIdError("");
          break;
        case "PermissionEnabled":
          newExpression = BaseConstraint.permissionEnabled("");
          setPermissionId("");
          setPermissionIdError("");
          break;
        case "InactiveUnlessRedelegated":
          newExpression = BaseConstraint.inactiveUnlessRedelegated("", 0);
          setAccount("");
          setPercentage("0");
          setPercentageError("");
          break;
        default:
          return;
      }

      updateNodeData<BaseNodeData>((currentData) => ({
        ...currentData,
        expression: newExpression,
      }));
    },
    [removeExistingChildNodes, updateNodeData],
  );

  const handlePermissionIdChange = useCallback(
    (value: string) => {
      setPermissionId(value);

      const validation = H256_HEX.safeParse(value);

      if (!validation.success && value.length > 0) {
        setPermissionIdError(
          validation.error.errors[0]?.message ?? "Invalid permission ID",
        );
      } else {
        setPermissionIdError("");
      }

      const expr = data.expression;
      if (expr.$ === "PermissionExists" || expr.$ === "PermissionEnabled") {
        updateNodeData<BaseNodeData>((currentData) => ({
          ...currentData,
          expression: { ...expr, pid: value },
        }));
      }
    },
    [data.expression, updateNodeData],
  );

  const handlePercentageChange = useCallback(
    (value: string) => {
      setPercentage(value);

      // Validate percentage range
      const numValue = parseFloat(value);
      if (value !== "" && (isNaN(numValue) || numValue < 0 || numValue > 100)) {
        setPercentageError("Percentage must be between 0 and 100");
        return;
      }

      setPercentageError("");

      updateNodeData<BaseNodeData>((currentData) => ({
        ...currentData,
        expression: {
          ...data.expression,
          percentage: BigInt(value || "0"),
        } as BaseConstraintType,
      }));
    },
    [data.expression, updateNodeData],
  );

  return (
    <PermissionNodeContainer id={id} data={data} hasSourceHandle={false}>
      <ConstraintSelect
        id={`${id}-type`}
        value={data.expression.$}
        onValueChange={handleTypeChange}
        isRenderingField={true} // All base constraint types render fields
        colorVariant={
          data.expression.$ === "PermissionExists"
            ? "green"
            : data.expression.$ === "PermissionEnabled"
              ? "emerald"
              : "gray" // data.expression.$ === "InactiveUnlessRedelegated"
        }
      >
        <ConstraintSelectIconItem
          value="PermissionExists"
          colorVariant="green"
          icon={<CheckCircle className="h-4 w-4 text-green-600" />}
          label="Permission Exists"
        />
        <ConstraintSelectIconItem
          value="PermissionEnabled"
          colorVariant="emerald"
          icon={<Play className="h-4 w-4 text-emerald-600" />}
          label="Permission Enabled"
        />
        <ConstraintSelectIconItem
          value="InactiveUnlessRedelegated"
          colorVariant="gray"
          icon={<Pause className="h-4 w-4 text-gray-300" />}
          label="Redelegating to"
        />
      </ConstraintSelect>

      {(data.expression.$ === "PermissionExists" ||
        data.expression.$ === "PermissionEnabled") && (
        <ConstraintInput
          id={`${id}-permission`}
          type="text"
          value={permissionId}
          onChange={(e) => handlePermissionIdChange(e.target.value)}
          placeholder="Enter permission ID"
          hasError={!!permissionIdError}
          errorMessage={permissionIdError}
        />
      )}

      {data.expression.$ === "InactiveUnlessRedelegated" && (
        <div className="relative w-full space-y-[0.05em]">
          <Badge className="text-xs cursor-default absolute scale-90 top-[0.4em] right-[0.3em] z-50">
            SS58
          </Badge>
          <ConstraintInput
            id={`${id}-account`}
            type="text"
            value={account}
            onChange={(e) => {
              const value = e.target.value;
              setAccount(value);
              updateNodeData<BaseNodeData>((currentData) => ({
                ...currentData,
                expression: {
                  ...data.expression,
                  account: value,
                } as BaseConstraintType,
              }));
            }}
            placeholder="Enter account ID"
          />

          <Badge className="text-xs cursor-default absolute scale-90 top-[3.4em] right-[0.3em] z-50">
            Percent
          </Badge>
          <ConstraintInput
            id={`${id}-percentage`}
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={percentage}
            onChange={(e) => handlePercentageChange(e.target.value)}
            placeholder="Enter percentage (0-100)"
            hasError={!!percentageError}
            errorMessage={percentageError}
          />
        </div>
      )}
    </PermissionNodeContainer>
  );
}
