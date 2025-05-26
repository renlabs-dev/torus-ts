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
    id: "max-delegation-depth",
    name: "Max Delegation Depth",
    description: "Limit delegation depth to 3 levels",
    constraint: {
      permId: "delegation-control",
      body: BoolExpr.base(
        BaseConstraint.maxDelegationDepth(NumExpr.literal(3)),
      ),
    },
  },
  {
    id: "rate-limit-hourly",
    name: "Hourly Rate Limit",
    description: "Allow max 100 operations per hour (600 blocks)",
    constraint: {
      permId: "operation-limit",
      body: BoolExpr.base(
        BaseConstraint.rateLimit(NumExpr.literal(100), NumExpr.literal(600)),
      ),
    },
  },
  {
    id: "stake-threshold",
    name: "Minimum Stake Requirement",
    description: "Require minimum stake of 1000 tokens",
    constraint: {
      permId: "stake-access",
      body: BoolExpr.comp(
        CompOp.Gte,
        NumExpr.stakeOf("user-account"),
        NumExpr.literal(1000),
      ),
    },
  },
  {
    id: "permission-combo",
    name: "Permission Combination",
    description: "Require both admin permission and stake > 500",
    constraint: {
      permId: "admin-access",
      body: BoolExpr.and(
        BoolExpr.base(BaseConstraint.permissionEnabled("admin-perm")),
        BoolExpr.comp(
          CompOp.Gt,
          NumExpr.stakeOf("user-account"),
          NumExpr.literal(500),
        ),
      ),
    },
  },
  {
    id: "complex-governance",
    name: "Complex Governance Rule",
    description: "Governance access with multiple conditions",
    constraint: {
      permId: "governance-vote",
      body: BoolExpr.and(
        BoolExpr.or(
          BoolExpr.base(BaseConstraint.permissionExists("council-member")),
          BoolExpr.comp(
            CompOp.Gte,
            NumExpr.stakeOf("user-account"),
            NumExpr.literal(10000),
          ),
        ),
        BoolExpr.not(BoolExpr.base(BaseConstraint.inactiveUnlessRedelegated())),
      ),
    },
  },
];
