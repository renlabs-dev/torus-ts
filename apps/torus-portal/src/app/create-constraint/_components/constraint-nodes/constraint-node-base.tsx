"use client";

import { useCallback, useState } from "react";
import type { NodeProps, Node, Edge } from "@xyflow/react";
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

  const createChildNodes = useCallback(
    (expression: BaseConstraintType): NodeCreationResult => {
      const nodes: Node[] = [];
      const edges: Edge[] = [];

      // No child nodes needed for current BaseConstraintType variants
      // All current types (PermissionExists, PermissionEnabled, InactiveUnlessRedelegated) 
      // have simple field values rather than complex expressions

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

  const shouldAutoCreate = false; // No auto-creation needed for current BaseConstraintType variants

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
          icon={<Pause className="h-4 w-4 text-gray-600" />}
          label="Inactive Unless Redelegated"
        />
      </ConstraintSelect>


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
      
      {data.expression.$ === "InactiveUnlessRedelegated" && (
        <>
          <div className="text-white relative">↓</div>
          
          <ConstraintInput
            id={`${id}-account`}
            type="text"
            value={account}
            onChange={(e) => {
              const value = e.target.value;
              setAccount(value);
              updateNodeData<BaseNodeData>((currentData) => ({
                ...currentData,
                expression: { ...data.expression, account: value } as BaseConstraintType,
              }));
            }}
            placeholder="Enter account ID"
          />
          
          <ConstraintInput
            id={`${id}-percentage`}
            type="number"
            value={percentage}
            onChange={(e) => {
              const value = e.target.value;
              setPercentage(value);
              updateNodeData<BaseNodeData>((currentData) => ({
                ...currentData,
                expression: { ...data.expression, percentage: BigInt(value || "0") } as BaseConstraintType,
              }));
            }}
            placeholder="Enter percentage (0-100)"
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
