import type { Edge } from "@xyflow/react";
import { BoolExpr } from "../../../utils/dsl";
import type { PermissionNode } from "./permission-node-types";

export const nodes: PermissionNode[] = [
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
];

export const edges: Edge[] = [];
