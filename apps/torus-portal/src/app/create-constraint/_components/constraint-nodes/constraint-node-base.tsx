"use client";

import { useCallback, useState } from "react";
import type { NodeProps } from "@xyflow/react";
import {
  ConstraintSelect,
  ConstraintInput,
  ConstraintSelectIconItem,
} from "./node-styled-components";
import { GitBranch, CheckCircle, Play, Timer, Pause } from "lucide-react";
import type { BaseConstraintType } from "@torus-ts/dsl";
import { BaseConstraint, NumExpr } from "@torus-ts/dsl";
import type { BaseNodeData, NodeCreationResult } from "./constraint-node-types";
import { createChildNodeId, createEdgeId } from "./constraint-node-types";
import {
  PermissionNodeContainer,
  useChildNodeManagement,
} from "./constraint-node-container";
import { H256_HEX } from "@torus-network/sdk";

interface PermissionNodeBaseProps {
  id: string;
  data: BaseNodeData;
}

export function PermissionNodeBase({ id, data }: PermissionNodeBaseProps) {
  const { removeExistingChildNodes, updateNodeData, addChildNodes } =
    useChildNodeManagement(id);

  const [permissionId, setPermissionId] = useState(() => {
    const expr = data.expression;
    if (expr.$ === "PermissionExists" || expr.$ === "PermissionEnabled") {
      return expr.pid || "";
    }
    return "";
  });
  const [permissionIdError, setPermissionIdError] = useState<string>("");

  const createChildNodes = useCallback(
    (expression: BaseConstraintType): NodeCreationResult => {
      const nodes = [];
      const edges = [];

      switch (expression.$) {
        case "MaxDelegationDepth": {
          const depthId = createChildNodeId(id, "depth");
          nodes.push({
            id: depthId,
            type: "permissionNumber",
            data: {
              type: "number",
              expression: expression.depth,
              label: "Max Depth",
            },
            position: { x: 0, y: 0 },
          });
          edges.push({
            id: createEdgeId(id, depthId),
            source: id,
            target: depthId,
            animated: true,
          });
          break;
        }

        case "RateLimit": {
          const maxOpsId = createChildNodeId(id, "maxOps");
          const periodId = createChildNodeId(id, "period");

          nodes.push({
            id: maxOpsId,
            type: "permissionNumber",
            data: {
              type: "number",
              expression: expression.maxOperations,
              label: "Max Operations",
            },
            position: { x: 0, y: 0 },
          });

          nodes.push({
            id: periodId,
            type: "permissionNumber",
            data: {
              type: "number",
              expression: expression.period,
              label: "Period (blocks)",
            },
            position: { x: 0, y: 0 },
          });

          edges.push({
            id: createEdgeId(id, maxOpsId),
            source: id,
            target: maxOpsId,
            animated: true,
          });

          edges.push({
            id: createEdgeId(id, periodId),
            source: id,
            target: periodId,
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
      const type = value as BaseConstraintType["$"];

      removeExistingChildNodes();

      let newExpression: BaseConstraintType;

      switch (type) {
        case "MaxDelegationDepth":
          newExpression = BaseConstraint.maxDelegationDepth(NumExpr.literal(1));
          break;
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
        case "RateLimit":
          newExpression = BaseConstraint.rateLimit(
            NumExpr.literal(10),
            NumExpr.literal(100),
          );
          break;
        case "InactiveUnlessRedelegated":
          newExpression = BaseConstraint.inactiveUnlessRedelegated();
          break;
        default:
          return;
      }

      updateNodeData<BaseNodeData>((currentData) => ({
        ...currentData,
        expression: newExpression,
      }));

      const childNodesResult = createChildNodes(newExpression);
      addChildNodes(childNodesResult);
    },
    [removeExistingChildNodes, updateNodeData, createChildNodes, addChildNodes],
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

  const shouldAutoCreate =
    data.expression.$ === "MaxDelegationDepth" ||
    data.expression.$ === "RateLimit";

  const hasSourceHandle = shouldAutoCreate;

  return (
    <PermissionNodeContainer
      id={id}
      data={data}
      hasSourceHandle={hasSourceHandle}
      createChildNodes={createChildNodes}
      shouldAutoCreateChildren={shouldAutoCreate}
    >
      <ConstraintSelect
        id={`${id}-type`}
        value={data.expression.$}
        onValueChange={handleTypeChange}
        colorVariant={
          data.expression.$ === "MaxDelegationDepth"
            ? "blue"
            : data.expression.$ === "PermissionExists"
              ? "green"
              : data.expression.$ === "PermissionEnabled"
                ? "emerald"
                : data.expression.$ === "RateLimit"
                  ? "orange"
                  : "gray" // data.expression.$ === "InactiveUnlessRedelegated"
        }
      >
        <ConstraintSelectIconItem
          value="MaxDelegationDepth"
          colorVariant="blue"
          icon={<GitBranch className="h-4 w-4 text-blue-600" />}
          label="Max Delegation Depth"
        />
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
          value="RateLimit"
          colorVariant="orange"
          icon={<Timer className="h-4 w-4 text-orange-600" />}
          label="Rate Limit"
        />
        <ConstraintSelectIconItem
          value="InactiveUnlessRedelegated"
          colorVariant="gray"
          icon={<Pause className="h-4 w-4 text-gray-600" />}
          label="Inactive Unless Redelegated"
        />
      </ConstraintSelect>

      {data.expression.$ === "RateLimit" && (
        <div className="text-white text-sm absolute top-[4.3em] flex gap-16 items-center justify-between">
          <div className="px-2 rounded-full bg-accent border border-[#B1B1B7]">
            MaxOperations
          </div>
          <div className="px-2 mr-6 rounded-full bg-accent border border-[#B1B1B7]">
            period
          </div>
        </div>
      )}

      {(data.expression.$ === "PermissionExists" ||
        data.expression.$ === "PermissionEnabled") && (
        <>
          <div className="text-white relative">↓</div>

          <ConstraintInput
            id={`${id}-permission`}
            type="text"
            value={permissionId}
            onChange={(e) => handlePermissionIdChange(e.target.value)}
            placeholder="Enter permission ID"
            hasError={!!permissionIdError}
            errorMessage={permissionIdError}
          />
        </>
      )}
    </PermissionNodeContainer>
  );
}

// Wrapper to satisfy ReactFlow's NodeProps type requirement
export default function PermissionNodeBaseWrapper(props: NodeProps) {
  return <PermissionNodeBase id={props.id} data={props.data as BaseNodeData} />;
}
