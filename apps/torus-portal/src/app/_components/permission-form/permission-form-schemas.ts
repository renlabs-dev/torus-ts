"use client";

import * as z from "zod";
import { CompOp } from "~/utils/dsl";

export type NumExprType =
  | { type: "UIntLiteral"; value: string }
  | { type: "BlockNumber" }
  | { type: "StakeOf"; account: string }
  | { type: "Add"; left: NumExprType; right: NumExprType }
  | { type: "Sub"; left: NumExprType; right: NumExprType }
  | { type: "WeightSet"; from: string; to: string }
  | { type: "WeightPowerFrom"; from: string; to: string };

export const numExprSchema: z.ZodType<NumExprType> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.object({
      type: z.literal("UIntLiteral"),
      value: z.string().min(1, "Value is required"),
    }),
    z.object({
      type: z.literal("BlockNumber"),
    }),
    z.object({
      type: z.literal("StakeOf"),
      account: z.string().min(1, "Account is required"),
    }),
    z.object({
      type: z.literal("Add"),
      left: z.lazy(() => numExprSchema),
      right: z.lazy(() => numExprSchema),
    }),
    z.object({
      type: z.literal("Sub"),
      left: z.lazy(() => numExprSchema),
      right: z.lazy(() => numExprSchema),
    }),
    z.object({
      type: z.literal("WeightSet"),
      from: z.string().min(1, "From account is required"),
      to: z.string().min(1, "To account is required"),
    }),
    z.object({
      type: z.literal("WeightPowerFrom"),
      from: z.string().min(1, "From account is required"),
      to: z.string().min(1, "To account is required"),
    }),
  ]),
);

export const baseConstraintSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("MaxDelegationDepth"),
    depth: numExprSchema,
  }),
  z.object({
    type: z.literal("PermissionExists"),
    pid: z.string().min(1, "Permission ID is required"),
  }),
  z.object({
    type: z.literal("PermissionEnabled"),
    pid: z.string().min(1, "Permission ID is required"),
  }),
  z.object({
    type: z.literal("RateLimit"),
    maxOperations: numExprSchema,
    period: numExprSchema,
  }),
  z.object({
    type: z.literal("InactiveUnlessRedelegated"),
  }),
]);

export type BoolExprType =
  | { type: "Not"; body: BoolExprType }
  | { type: "And"; left: BoolExprType; right: BoolExprType }
  | { type: "Or"; left: BoolExprType; right: BoolExprType }
  | { type: "CompExpr"; op: CompOp; left: NumExprType; right: NumExprType }
  | { type: "Base"; body: z.infer<typeof baseConstraintSchema> };
export const boolExprSchema: z.ZodType<BoolExprType> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.object({
      type: z.literal("Not"),
      body: boolExprSchema,
    }),
    z.object({
      type: z.literal("And"),
      left: boolExprSchema,
      right: boolExprSchema,
    }),
    z.object({
      type: z.literal("Or"),
      left: boolExprSchema,
      right: boolExprSchema,
    }),
    z.object({
      type: z.literal("CompExpr"),
      op: z.nativeEnum(CompOp),
      left: numExprSchema,
      right: numExprSchema,
    }),
    z.object({
      type: z.literal("Base"),
      body: baseConstraintSchema,
    }),
  ]),
);

export const formSchema = z.object({
  body: boolExprSchema,
});

export type FormSchema = z.infer<typeof formSchema>;
