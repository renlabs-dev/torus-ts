import { z } from "zod";

import { H256_HEX, SS58_SCHEMA } from "@torus-network/sdk/types";

import type { BaseConstraintType, NumExprType } from "@torus-ts/dsl";

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
export const numExprValidationSchema: z.ZodType<NumExprType> =
  z.discriminatedUnion("$", [
    z.object({
      $: z.literal("UIntLiteral"),
      value: z.bigint(),
    }),
    z.object({
      $: z.literal("BlockNumber"),
    }),
    z.object({
      $: z.literal("StakeOf"),
      account: SS58_SCHEMA,
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
  ]);

export const baseConstraintValidationSchema: z.ZodType<BaseConstraintType> =
  z.discriminatedUnion("$", [
    z.object({
      $: z.literal("PermissionExists"),
      pid: H256_HEX,
    }),
    z.object({
      $: z.literal("PermissionEnabled"),
      pid: H256_HEX,
    }),
    z.object({
      $: z.literal("InactiveUnlessRedelegated"),
      account: SS58_SCHEMA,
      percentage: z.bigint(),
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
  permId: H256_HEX,
  body: boolExprValidationSchema,
});
