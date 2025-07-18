// Re-export all types from types.ts
export * from "./types";

// Import specific types for helper functions
import type {
  Constraint as ConstraintType,
  BoolExprType,
  BaseConstraintType,
  NumExprType,
  CompOp,
  PermId,
  AccountId,
} from "./types";

/**
 * Helper functions to create constraint expressions
 */
export const ConstraintBuilder = {
  /**
   * Create a constraint with a boolean expression
   * @param permId The permission ID
   * @param body The boolean expression
   */
  create: (permId: PermId, body: BoolExprType): ConstraintType => ({
    permId,
    body,
  }),
};

/**
 * Helper functions to create base constraints
 */
export const BaseConstraint = {
  /**
   * Create a permission exists constraint
   * @param pid The permission ID to check for
   */
  permissionExists: (pid: PermId): BaseConstraintType => ({
    $: "PermissionExists",
    pid,
  }),

  /**
   * Create a permission enabled constraint
   * @param pid The permission ID to check if enabled
   */
  permissionEnabled: (pid: PermId): BaseConstraintType => ({
    $: "PermissionEnabled",
    pid,
  }),

  /**
   * Create an inactive unless redelegated constraint
   * @param account The account to check
   * @param percentage The percentage threshold
   */
  inactiveUnlessRedelegated: (
    account: AccountId,
    percentage: number | bigint,
  ): BaseConstraintType => ({
    $: "InactiveUnlessRedelegated",
    account,
    percentage:
      typeof percentage === "number" ? BigInt(percentage) : percentage,
  }),
};

/**
 * Helper functions to create numeric expressions
 */
export const NumExpr = {
  literal: (value: number | bigint): NumExprType => ({
    $: "UIntLiteral",
    value: typeof value === "number" ? BigInt(value) : value,
  }),
  blockNumber: (): NumExprType => ({ $: "BlockNumber" }),
  stakeOf: (account: AccountId): NumExprType => ({ $: "StakeOf", account }),
  add: (left: NumExprType, right: NumExprType): NumExprType => ({
    $: "Add",
    left,
    right,
  }),
  sub: (left: NumExprType, right: NumExprType): NumExprType => ({
    $: "Sub",
    left,
    right,
  }),
};

/**
 * Helper functions to create boolean expressions
 */
export const BoolExpr = {
  not: (body: BoolExprType): BoolExprType => ({ $: "Not", body }),
  and: (left: BoolExprType, right: BoolExprType): BoolExprType => ({
    $: "And",
    left,
    right,
  }),
  or: (left: BoolExprType, right: BoolExprType): BoolExprType => ({
    $: "Or",
    left,
    right,
  }),
  comp: (op: CompOp, left: NumExprType, right: NumExprType): BoolExprType => ({
    $: "CompExpr",
    op,
    left,
    right,
  }),
  base: (body: BaseConstraintType): BoolExprType => ({ $: "Base", body }),
};

// Export constraint processing functionality
export * from "./processor";

// Export constraint validation functionality
export * from "./validation";

// Export constraint serialization functionality
export * from "./serialization";

// Export Zod schema
export * from "./schema";

// Export analyzer functionality for RETE algorithm
export * from "./analyzer";

// Export facts extraction functionality
export * from "./facts";

// Export Rete network implementation
export * from "./rete";

// Export chain fetcher functionality
export * from "./chain-fetcher";

// Export chain watcher functionality
export * from "./chain-watcher";
