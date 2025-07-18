import type { Node, Edge } from "@xyflow/react";
import { BoolExpr } from "@torus-ts/dsl";
import type { ConstraintNodeData } from "../constraint-nodes/constraint-node-types";

export const nodes: Node<ConstraintNodeData>[] = [
  {
    id: "permission-id",
    type: "permissionId",
    data: {
      type: "permissionId",
      permissionId: "",
      label: "Permission ID",
    },
    position: { x: 0, y: -50 },
  },
  {
    id: "root-boolean",
    type: "permissionBoolean",
    data: {
      type: "boolean",
      expression: BoolExpr.base({
        $: "InactiveUnlessRedelegated",
        account: "",
        percentage: BigInt(0),
      }),
      label: "Permission Root",
    },
    position: { x: 0, y: 0 },
  },
  {
    id: "root-boolean-base",
    type: "permissionBase",
    data: {
      type: "base",
      expression: {
        $: "InactiveUnlessRedelegated",
        account: "",
        percentage: BigInt(0),
      },
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
