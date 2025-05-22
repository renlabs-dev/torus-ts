"use client";

import type * as z from "zod";
import type {
  baseConstraintSchema,
  boolExprSchema,
  numExprSchema,
} from "./permission-form-schemas";
import type { NumExpr, BaseConstraint, BoolExpr } from "~/utils/dsl";

// Helper functions to convert form data to match DSL structure
export function convertNumExpr(expr: z.infer<typeof numExprSchema>): NumExpr {
  switch (expr.type) {
    case "UIntLiteral":
      return {
        $: "UIntLiteral",
        value: BigInt(expr.value),
      };
    case "BlockNumber":
      return { $: "BlockNumber" };
    case "StakeOf":
      return { $: "StakeOf", account: expr.account };
    case "Add":
      return {
        $: "Add",
        left: convertNumExpr(expr.left),
        right: convertNumExpr(expr.right),
      };
    case "Sub":
      return {
        $: "Sub",
        left: convertNumExpr(expr.left),
        right: convertNumExpr(expr.right),
      };
    case "WeightSet":
      return {
        $: "WeightSet",
        from: expr.from,
        to: expr.to,
      };
    case "WeightPowerFrom":
      return {
        $: "WeightPowerFrom",
        from: expr.from,
        to: expr.to,
      };
    default:
      throw new Error(
        `Unknown numeric expression type: ${(expr as { type: string }).type}`,
      );
  }
}

export function convertBaseConstraint(
  constraint: z.infer<typeof baseConstraintSchema>,
): BaseConstraint {
  switch (constraint.type) {
    case "MaxDelegationDepth":
      return {
        $: "MaxDelegationDepth",
        depth: convertNumExpr(constraint.depth),
      };
    case "PermissionExists":
      return { $: "PermissionExists", pid: constraint.pid };
    case "PermissionEnabled":
      return { $: "PermissionEnabled", pid: constraint.pid };
    case "RateLimit":
      return {
        $: "RateLimit",
        maxOperations: convertNumExpr(constraint.maxOperations),
        period: convertNumExpr(constraint.period),
      };
    case "InactiveUnlessRedelegated":
      return { $: "InactiveUnlessRedelegated" };
    default:
      throw new Error(
        `Unknown base constraint type: ${(constraint as { type: string }).type}`,
      );
  }
}

export function convertBoolExpr(
  expr: z.infer<typeof boolExprSchema>,
): BoolExpr {
  switch (expr.type) {
    case "Not":
      return { $: "Not", body: convertBoolExpr(expr.body) };
    case "And":
      return {
        $: "And",
        left: convertBoolExpr(expr.left),
        right: convertBoolExpr(expr.right),
      };
    case "Or":
      return {
        $: "Or",
        left: convertBoolExpr(expr.left),
        right: convertBoolExpr(expr.right),
      };
    case "CompExpr":
      return {
        $: "CompExpr",
        op: expr.op,
        left: convertNumExpr(expr.left),
        right: convertNumExpr(expr.right),
      };
    case "Base":
      return { $: "Base", body: convertBaseConstraint(expr.body) };
    default:
      throw new Error(
        `Unknown boolean expression type: ${(expr as { type: string }).type}`,
      );
  }
}
