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
import { BaseConstraint, NumExpr } from "../../../utils/dsl";
import type { BaseNodeData, NodeCreationResult } from "./permission-node-types";
import { createChildNodeId, createEdgeId } from "./permission-node-types";
import { permissionIdSchema } from "./permission-validation-schemas";

interface PermissionNodeBaseProps {
  id: string;
  data: BaseNodeData;
}

export function PermissionNodeBase({ id, data }: PermissionNodeBaseProps) {
  const { setNodes, setEdges, getNodes, getEdges } = useReactFlow();
  const [permissionId, setPermissionId] = useState(() => {
    const expr = data.expression;
    if (expr.$ === "PermissionExists" || expr.$ === "PermissionEnabled") {
      return expr.pid || "";
    }
    return "";
  });
  const [permissionIdError, setPermissionIdError] = useState<string>("");

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
        setNodes((nodes) =>
          nodes.map((node) => {
            if (node.id === id) {
              return {
                ...node,
                data: {
                  ...data,
                  expression: { ...expr, pid: value },
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

  // Auto-create child nodes on mount if expression requires them
  useEffect(() => {
    const currentNodes = getNodes();
    const hasChildren = currentNodes.some((node) =>
      node.id.startsWith(`${id}-`),
    );

    if (
      !hasChildren &&
      (data.expression.$ === "MaxDelegationDepth" ||
        data.expression.$ === "RateLimit")
    ) {
      const { nodes: childNodes, edges: childEdges } = createChildNodes(
        data.expression,
      );
      setNodes((nodes) => nodes.concat(childNodes));
      setEdges((edges) => edges.concat(childEdges));
    }
  }, [id, data.expression, getNodes, createChildNodes, setNodes, setEdges]);

  return (
    <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4 min-w-[250px]">
      <div className="mb-2 font-bold text-orange-900">{data.label}</div>

      <div className="mb-3">
        <Label
          htmlFor={`${id}-type`}
          className="text-sm font-medium text-gray-700 mb-1"
        >
          Constraint Type
        </Label>
        <Select value={data.expression.$} onValueChange={handleTypeChange}>
          <SelectTrigger id={`${id}-type`} className="w-full bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MaxDelegationDepth">
              Max Delegation Depth
            </SelectItem>
            <SelectItem value="PermissionExists">Permission Exists</SelectItem>
            <SelectItem value="PermissionEnabled">
              Permission Enabled
            </SelectItem>
            <SelectItem value="RateLimit">Rate Limit</SelectItem>
            <SelectItem value="InactiveUnlessRedelegated">
              Inactive Unless Redelegated
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {(data.expression.$ === "PermissionExists" ||
        data.expression.$ === "PermissionEnabled") && (
        <div className="mb-3">
          <Label
            htmlFor={`${id}-permission`}
            className="text-sm font-medium text-gray-700 mb-1"
          >
            Permission ID
          </Label>
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

      {data.expression.$ === "InactiveUnlessRedelegated" && (
        <div className="text-sm text-gray-600 italic">
          No additional configuration needed
        </div>
      )}

      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-orange-500"
      />
      {(data.expression.$ === "MaxDelegationDepth" ||
        data.expression.$ === "RateLimit") && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 bg-orange-600"
        />
      )}
    </div>
  );
}

// Wrapper to satisfy ReactFlow's NodeProps type requirement
export default function PermissionNodeBaseWrapper(props: NodeProps) {
  return <PermissionNodeBase id={props.id} data={props.data as BaseNodeData} />;
}
