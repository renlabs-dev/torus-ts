import { z } from 'zod';
import {
  CompOp
  
  
  
  
  
  
  
} from './types';
import type {Constraint, BoolExprType, BaseConstraintType, NumExprType, UInt} from './types';

/**
 * Type mapping from TypeScript types to Zod schemas
 * This helps create a more dynamic schema system where the schemas
 * are derived from the TypeScript types
 */
interface SchemaMap {
  CompOp: z.ZodEnum<[string, ...string[]]>;
  UInt: z.ZodType<UInt>;
  AccountId: z.ZodString;
  PermId: z.ZodString;
  NumExpr: z.ZodType<NumExprType>;
  BaseConstraint: z.ZodType<BaseConstraintType>;
  BoolExpr: z.ZodType<BoolExprType>;
  Constraint: z.ZodType<Constraint>;
}

/**
 * Create a Zod schema map from TypeScript types
 * This allows the schemas to be defined based on the TypeScript types,
 * ensuring that changes to the types are reflected in the schemas
 */
export const createSchemaMap = (): SchemaMap => {
  // Create CompOp schema safely by explicitly listing all enum values
  // This avoids issues with Object.values(CompOp)
  const CompOpSchema = z.enum([
    CompOp.Gt,
    CompOp.Lt,
    CompOp.Gte,
    CompOp.Lte,
    CompOp.Eq
  ]);
  
  // UInt schema with conversion from string/number to BigInt
  // Use transform to ensure we always get a bigint
  const UIntSchema = z.union([
    z.string().transform(val => BigInt(val)),
    z.number().transform(val => BigInt(val)),
    z.bigint()
  ]) as z.ZodType<UInt>;
  
  const AccountIdSchema = z.string();
  const PermIdSchema = z.string();
  
  // Create recursive schemas using z.lazy()
  // NumExpr schema
  const NumExprSchema: z.ZodType<NumExprType> = z.lazy(() => 
    z.discriminatedUnion('$', [
      z.object({
        $: z.literal('UIntLiteral'),
        value: UIntSchema
      }),
      z.object({
        $: z.literal('BlockNumber')
      }),
      z.object({
        $: z.literal('StakeOf'),
        account: AccountIdSchema
      }),
      z.object({
        $: z.literal('Add'),
        left: NumExprSchema,
        right: NumExprSchema
      }),
      z.object({
        $: z.literal('Sub'),
        left: NumExprSchema,
        right: NumExprSchema
      }),
    ])
  );

  // BaseConstraint schema
  const BaseConstraintSchema: z.ZodType<BaseConstraintType> = z.discriminatedUnion('$', [
    z.object({
      $: z.literal('PermissionExists'),
      pid: PermIdSchema
    }),
    z.object({
      $: z.literal('PermissionEnabled'),
      pid: PermIdSchema
    }),
    z.object({
      $: z.literal('InactiveUnlessRedelegated'),
      account: AccountIdSchema,
      percentage: UIntSchema // This is a UInt, but represents a percentage
    })
  ]);

  // BoolExpr schema
  const BoolExprSchema: z.ZodType<BoolExprType> = z.lazy(() => 
    z.discriminatedUnion('$', [
      z.object({
        $: z.literal('Not'),
        body: BoolExprSchema
      }),
      z.object({
        $: z.literal('And'),
        left: BoolExprSchema,
        right: BoolExprSchema
      }),
      z.object({
        $: z.literal('Or'),
        left: BoolExprSchema,
        right: BoolExprSchema
      }),
      z.object({
        $: z.literal('CompExpr'),
        op: CompOpSchema,
        left: NumExprSchema,
        right: NumExprSchema
      }),
      z.object({
        $: z.literal('Base'),
        body: BaseConstraintSchema
      })
    ])
  );

  // Constraint schema
  const ConstraintSchema: z.ZodType<Constraint> = z.object({
    permId: PermIdSchema,
    body: BoolExprSchema
  });

  return {
    CompOp: CompOpSchema,
    UInt: UIntSchema,
    AccountId: AccountIdSchema,
    PermId: PermIdSchema,
    NumExpr: NumExprSchema,
    BaseConstraint: BaseConstraintSchema,
    BoolExpr: BoolExprSchema,
    Constraint: ConstraintSchema
  };
};

// Create schemas immediately
const schemaMap = createSchemaMap();

// Export the schemas for use in validation
export const ConstraintSchema = schemaMap.Constraint;

// Export other schemas for individual validation if needed
export const CompOpSchema = schemaMap.CompOp;
export const UIntSchema = schemaMap.UInt;
export const NumExprSchema = schemaMap.NumExpr;
export const BaseConstraintSchema = schemaMap.BaseConstraint;
export const BoolExprSchema = schemaMap.BoolExpr;

/**
 * Validates a constraint using Zod schema validation
 * @param data The data to validate
 * @returns The validated constraint
 * @throws ZodError if validation fails
 */
export function validateWithZod(data: unknown): Constraint {
  return ConstraintSchema.parse(data);
}

/**
 * Safely validates a constraint using Zod schema validation
 * @param data The data to validate
 * @returns A result object with success flag and either validated data or error
 */
export function safeValidateWithZod(data: unknown): 
  { success: true; data: Constraint } | { success: false; error: z.ZodError } {
  const result = ConstraintSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    return { success: false, error: result.error };
  }
}