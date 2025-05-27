import type { Node, Edge } from "@xyflow/react";
import { BoolExpr } from "../../../../utils/dsl";
import type { PermissionNodeData } from "../constraint-nodes/constraint-node-types";

export const nodes: Node<PermissionNodeData>[] = [
  {
    id: "permission-id",
    type: "permissionId",
    data: {
      type: "permissionId",
      permissionId: "",
      label: "Permission ID",
    },
    position: { x: 0, y: -100 },
  },
  {
    id: "root-boolean",
    type: "permissionBoolean",
    data: {
      type: "boolean",
      expression: BoolExpr.base({ $: "InactiveUnlessRedelegated" }),
      label: "Permission Root",
    },
    position: { x: 0, y: 0 },
  },
  {
    id: "root-boolean-base",
    type: "permissionBase",
    data: {
      type: "base",
      expression: { $: "InactiveUnlessRedelegated" },
      label: "Base Constraint",
    },
    position: { x: 0, y: 0 },
  },
];

export const edges: Edge[] = [
  {
    id: "permission-id-root-boolean",
    source: "permission-id",
    target: "root-boolean",
    animated: true,
  },
  {
    id: "root-boolean-root-boolean-base",
    source: "root-boolean",
    target: "root-boolean-base",
    animated: true,
  },
];
