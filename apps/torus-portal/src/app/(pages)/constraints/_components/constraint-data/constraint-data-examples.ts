import type { Constraint } from "~/utils/dsl";
import { BaseConstraint, BoolExpr, CompOp, NumExpr } from "~/utils/dsl";

export interface ConstraintExample {
  id: string;
  name: string;
  description: string;
  constraint: Constraint;
}

export const constraintExamples: ConstraintExample[] = [
  {
    id: "stake-gate",
    name: "Stake Gate",
    description: "Basic stake requirement gate for access control",
    constraint: {
      permId: "1",
      body: BoolExpr.comp(
        CompOp.Gte,
        NumExpr.stakeOf(""),
        NumExpr.literal(1000),
      ),
    },
  },
  {
    id: "has-permission",
    name: "Has Permission",
    description: "Check if a specific permission exists",
    constraint: {
      permId: "2",
      body: BoolExpr.base(BaseConstraint.permissionExists("100")),
    },
  },
  {
    id: "permission-enabled",
    name: "Permission Enabled",
    description: "Check if a specific permission is enabled",
    constraint: {
      permId: "3",
      body: BoolExpr.base(BaseConstraint.permissionEnabled("100")),
    },
  },
  {
    id: "redelegation-requirement",
    name: "Redelegation Requirement",
    description: "Requires user to have redelegated a minimum percentage",
    constraint: {
      permId: "4",
      body: BoolExpr.base(BaseConstraint.inactiveUnlessRedelegated("", 5)),
    },
  },
  {
    id: "stake-or-permission",
    name: "Stake or Permission",
    description: "Requires either sufficient stake OR a specific permission",
    constraint: {
      permId: "5",
      body: BoolExpr.or(
        BoolExpr.comp(CompOp.Gte, NumExpr.stakeOf(""), NumExpr.literal(1000)),
        BoolExpr.base(BaseConstraint.permissionEnabled("100")),
      ),
    },
  },
  {
    id: "multiple-requirements",
    name: "Multiple Requirements",
    description: "Requires both stake AND redelegation",
    constraint: {
      permId: "6",
      body: BoolExpr.and(
        BoolExpr.comp(CompOp.Gte, NumExpr.stakeOf(""), NumExpr.literal(5000)),
        BoolExpr.base(BaseConstraint.inactiveUnlessRedelegated("", 10)),
      ),
    },
  },
  {
    id: "complex-tiered",
    name: "Complex Tiered Access",
    description: "Multi-tier access based on stake and permissions",
    constraint: {
      permId: "7",
      body: BoolExpr.or(
        BoolExpr.comp(CompOp.Gte, NumExpr.stakeOf(""), NumExpr.literal(10000)),
        BoolExpr.and(
          BoolExpr.comp(CompOp.Gte, NumExpr.stakeOf(""), NumExpr.literal(5000)),
          BoolExpr.base(BaseConstraint.permissionExists("")),
        ),
      ),
    },
  },
];
