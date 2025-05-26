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
import { GitBranch, CheckCircle, Play, Timer, Pause } from "lucide-react";
import { BaseConstraint, NumExpr } from "../../../utils/dsl";
import type { BaseNodeData, NodeCreationResult } from "./permission-node-types";
import { createChildNodeId, createEdgeId } from "./permission-node-types";
import { permissionIdSchema } from "./permission-validation-schemas";
import {
  PermissionNodeContainer,
  useChildNodeManagement,
} from "./permission-node-container";

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
    (expression: BaseConstraint): NodeCreationResult => {
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
          });

          edges.push({
            id: createEdgeId(id, periodId),
            source: id,
            target: periodId,
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
      const type = value as BaseConstraint["$"];

      removeExistingChildNodes();

      let newExpression: BaseConstraint;

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

      const validation = permissionIdSchema.safeParse(value);

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
      <Select value={data.expression.$} onValueChange={handleTypeChange}>
        <SelectTrigger
          id={`${id}-type`}
          className={`border transition-all border-[#B1B1B7] pr-0 duration-200 rounded-full
            [&>svg]:invisible ${ data.expression.$ === "MaxDelegationDepth" &&
            "bg-blue-50 text-blue-700" } ${ data.expression.$ === "PermissionExists" &&
            "bg-green-50 text-green-700" } ${ data.expression.$ === "PermissionEnabled" &&
            "bg-emerald-50 text-emerald-700" } ${ data.expression.$ === "RateLimit" &&
            "bg-orange-50 text-orange-700" } ${ data.expression.$ ===
            "InactiveUnlessRedelegated" && "bg-gray-50 text-gray-700" }`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="MaxDelegationDepth" className="hover:bg-blue-50">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-blue-600" />
              <span>Max Delegation Depth</span>
            </div>
          </SelectItem>
          <SelectItem value="PermissionExists" className="hover:bg-green-50">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Permission Exists</span>
            </div>
          </SelectItem>
          <SelectItem value="PermissionEnabled" className="hover:bg-emerald-50">
            <div className="flex items-center gap-2">
              <Play className="h-4 w-4 text-emerald-600" />
              <span>Permission Enabled</span>
            </div>
          </SelectItem>
          <SelectItem value="RateLimit" className="hover:bg-orange-50">
            <div className="flex items-center gap-2">
              <Timer className="h-4 w-4 text-orange-600" />
              <span>Rate Limit</span>
            </div>
          </SelectItem>
          <SelectItem
            value="InactiveUnlessRedelegated"
            className="hover:bg-gray-50"
          >
            <div className="flex items-center gap-2">
              <Pause className="h-4 w-4 text-gray-600" />
              <span>Inactive Unless Redelegated</span>
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      {(data.expression.$ === "PermissionExists" ||
        data.expression.$ === "PermissionEnabled") && (
        <div className="mt-3">
          <Input
            id={`${id}-permission`}
            type="text"
            value={permissionId}
            onChange={(e) => handlePermissionIdChange(e.target.value)}
            className={`w-full ${permissionIdError ? "border-red-500" : ""}`}
            placeholder="Enter permission ID"
          />
          {permissionIdError && (
            <p className="text-red-500 text-xs mt-1">{permissionIdError}</p>
          )}
        </div>
      )}
    </PermissionNodeContainer>
  );
}

// Wrapper to satisfy ReactFlow's NodeProps type requirement
export default function PermissionNodeBaseWrapper(props: NodeProps) {
  return <PermissionNodeBase id={props.id} data={props.data as BaseNodeData} />;
}
