import { z } from "zod";
import type { NumExpr, BaseConstraint } from "../../../utils/dsl";

// Base schemas for each field type
export const permissionIdSchema = z
  .string()
  .min(1, "Permission ID is required")
  .regex(/^[a-zA-Z0-9_-]+$/, "Invalid permission ID format");

export const accountIdSchema = z
  .string()
  .min(1, "Account ID is required")
  .regex(/^[a-zA-Z0-9_-]+$/, "Invalid account ID format");

export const uintSchema = z
  .string()
  .min(1, "Value is required")
  .regex(/^\d+$/, "Must be a positive integer")
  .refine((val) => {
    try {
      BigInt(val);
      return true;
    } catch {
      return false;
    }
  }, "Value is too large");

// Validation schemas for each expression type
export const numExprValidationSchema: z.ZodType<NumExpr> = z.discriminatedUnion(
  "$",
  [
    z.object({
      $: z.literal("UIntLiteral"),
      value: z.bigint(),
    }),
    z.object({
      $: z.literal("BlockNumber"),
    }),
    z.object({
      $: z.literal("StakeOf"),
      account: accountIdSchema,
    }),
    z.object({
      $: z.literal("Add"),
      left: z.lazy(() => numExprValidationSchema),
      right: z.lazy(() => numExprValidationSchema),
    }),
    z.object({
      $: z.literal("Sub"),
      left: z.lazy(() => numExprValidationSchema),
      right: z.lazy(() => numExprValidationSchema),
    }),
    z.object({
      $: z.literal("WeightSet"),
      from: accountIdSchema,
      to: accountIdSchema,
    }),
    z.object({
      $: z.literal("WeightPowerFrom"),
      from: accountIdSchema,
      to: accountIdSchema,
    }),
  ],
);

export const baseConstraintValidationSchema: z.ZodType<BaseConstraint> =
  z.discriminatedUnion("$", [
    z.object({
      $: z.literal("MaxDelegationDepth"),
      depth: numExprValidationSchema,
    }),
    z.object({
      $: z.literal("PermissionExists"),
      pid: permissionIdSchema,
    }),
    z.object({
      $: z.literal("PermissionEnabled"),
      pid: permissionIdSchema,
    }),
    z.object({
      $: z.literal("RateLimit"),
      maxOperations: numExprValidationSchema,
      period: numExprValidationSchema,
    }),
    z.object({
      $: z.literal("InactiveUnlessRedelegated"),
    }),
  ]);

export const compOpSchema = z.enum(["Gt", "Lt", "Gte", "Lte", "Eq"]);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const boolExprValidationSchema: z.ZodType<any> = z.discriminatedUnion(
  "$",
  [
    z.object({
      $: z.literal("Not"),
      body: z.lazy(() => boolExprValidationSchema),
    }),
    z.object({
      $: z.literal("And"),
      left: z.lazy(() => boolExprValidationSchema),
      right: z.lazy(() => boolExprValidationSchema),
    }),
    z.object({
      $: z.literal("Or"),
      left: z.lazy(() => boolExprValidationSchema),
      right: z.lazy(() => boolExprValidationSchema),
    }),
    z.object({
      $: z.literal("CompExpr"),
      op: compOpSchema,
      left: numExprValidationSchema,
      right: numExprValidationSchema,
    }),
    z.object({
      $: z.literal("Base"),
      body: baseConstraintValidationSchema,
    }),
  ],
);

export const constraintValidationSchema = z.object({
  permId: permissionIdSchema,
  body: boolExprValidationSchema,
});
