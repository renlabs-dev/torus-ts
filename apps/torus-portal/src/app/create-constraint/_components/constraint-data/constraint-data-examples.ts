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
    id: "stake-tier",
    name: "Stake Tier",
    description: "Tiered access based on stake amount with rate limiting",
    constraint: {
      permId: "2",
      body: BoolExpr.or(
        BoolExpr.comp(CompOp.Gte, NumExpr.stakeOf(""), NumExpr.literal(10000)),
        BoolExpr.or(
          BoolExpr.and(
            BoolExpr.comp(
              CompOp.Gte,
              NumExpr.stakeOf(""),
              NumExpr.literal(5000),
            ),
            BoolExpr.base(
              BaseConstraint.inactiveUnlessRedelegated("", 50),
            ),
          ),
          BoolExpr.and(
            BoolExpr.comp(
              CompOp.Eq,
              NumExpr.stakeOf(""),
              NumExpr.literal(2500),
            ),
            BoolExpr.base(
              BaseConstraint.inactiveUnlessRedelegated("", 25),
            ),
          ),
        ),
      ),
    },
  },
  // {
  //   id: "emission-tier",
  //   name: "Emission Tier",
  //   description: "Tiered emission access based on delegation percentage",
  //   constraint: {
  //     permId: "2",
  //     body: BoolExpr.or(
  //       BoolExpr.comp(
  //         CompOp.Gte,
  //         NumExpr.hasToDelegate(""),
  //         NumExpr.decimal("5%"),
  //       ),
  //       BoolExpr.or(
  //         BoolExpr.and(
  //           BoolExpr.comp(
  //             CompOp.Gte,
  //             NumExpr.hasToDelegate(""),
  //             NumExpr.decimal("3%"),
  //           ),
  //           BoolExpr.base(
  //             BaseConstraint.rateLimit(
  //               NumExpr.literal(10),
  //               NumExpr.literal(1000),
  //             ),
  //           ),
  //         ),
  //         BoolExpr.and(
  //           BoolExpr.comp(
  //             CompOp.Eq,
  //             NumExpr.hasToDelegate(""),
  //             NumExpr.decimal("1.5%"),
  //           ),
  //           BoolExpr.base(
  //             BaseConstraint.rateLimit(
  //               NumExpr.literal(5),
  //               NumExpr.literal(1000),
  //             ),
  //           ),
  //         ),
  //       ),
  //     ),
  //   },
  // },
  {
    id: "rate-limit-basic",
    name: "Rate Limit",
    description: "Basic rate limiting: 10 operations per 1000 blocks",
    constraint: {
      permId: "3",
      body: BoolExpr.base(
        BaseConstraint.permissionExists("0x123"),
      ),
    },
  },
  {
    id: "depth-limit-basic",
    name: "Depth Limit",
    description: "Limit delegation depth to 3 levels maximum",
    constraint: {
      permId: "4",
      body: BoolExpr.base(
        BaseConstraint.permissionEnabled("0x456"),
      ),
    },
  },
];
