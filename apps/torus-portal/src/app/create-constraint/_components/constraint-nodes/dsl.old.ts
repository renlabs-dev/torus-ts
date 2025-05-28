// Basic type aliases
export type Hash = string;
export type UInt = bigint;
export type AccountId = string;
export type Decimal = number;

/**
 * Permission ID - bytestring identifier
 */
export type PermId = Hash;

/**
 * Comparison operators for numeric expressions
 */
export enum CompOp {
  Gt = "Gt", // Greater than
  Lt = "Lt", // Less than
  Gte = "Gte", // Greater than or equal
  Lte = "Lte", // Less than or equal
  Eq = "Eq", // Equal
}

/**
 * Numeric expression types
 */
export type NumExpr =
  | { $: "UIntLiteral"; value: UInt }
  | { $: "BlockNumber" }
  | { $: "StakeOf"; account: AccountId }
  | { $: "Add"; left: NumExpr; right: NumExpr }
  | { $: "Sub"; left: NumExpr; right: NumExpr }
  | { $: "WeightSet"; from: AccountId; to: AccountId }
  | { $: "WeightPowerFrom"; from: AccountId; to: AccountId };

/**
 * Base constraint expressions
 */
export type BaseConstraint =
  | { $: "MaxDelegationDepth"; depth: NumExpr }
  | { $: "PermissionExists"; pid: PermId }
  | { $: "PermissionEnabled"; pid: PermId }
  | { $: "RateLimit"; maxOperations: NumExpr; period: NumExpr }
  | { $: "InactiveUnlessRedelegated" };

/**
 * Boolean expression types
 */
export type BoolExpr =
  | { $: "Not"; body: BoolExpr }
  | { $: "And"; left: BoolExpr; right: BoolExpr }
  | { $: "Or"; left: BoolExpr; right: BoolExpr }
  | { $: "CompExpr"; op: CompOp; left: NumExpr; right: NumExpr }
  | { $: "Base"; body: BaseConstraint };

/**
 * Main constraint type
 */
export interface Constraint {
  // Refers to the onchain permission that this constraint applies to
  permId: PermId;
  body: BoolExpr;
}

/**
 * Helper functions to create constraint expressions
 */
export const Constraint = {
  /**
   * Create a constraint with a boolean expression
   * @param permId The permission ID
   * @param body The boolean expression
   */
  create: (permId: PermId, body: BoolExpr): Constraint => ({
    permId,
    body,
  }),
};

/**
 * Helper functions to create base constraints
 */
export const BaseConstraint = {
  /**
   * Create a maximum delegation depth constraint
   * @param depth Maximum delegation depth
   */
  maxDelegationDepth: (depth: NumExpr): BaseConstraint => ({
    $: "MaxDelegationDepth",
    depth,
  }),

  /**
   * Create a permission exists constraint
   * @param pid The permission ID to check for
   */
  permissionExists: (pid: PermId): BaseConstraint => ({
    $: "PermissionExists",
    pid,
  }),

  /**
   * Create a permission enabled constraint
   * @param pid The permission ID to check if enabled
   */
  permissionEnabled: (pid: PermId): BaseConstraint => ({
    $: "PermissionEnabled",
    pid,
  }),

  /**
   * Create a rate limit constraint
   * @param maxOperations Maximum number of operations
   * @param period Time period in blocks
   */
  rateLimit: (maxOperations: NumExpr, period: NumExpr): BaseConstraint => ({
    $: "RateLimit",
    maxOperations,
    period,
  }),

  /**
   * Create an inactive unless redelegated constraint
   */
  inactiveUnlessRedelegated: (): BaseConstraint => ({
    $: "InactiveUnlessRedelegated",
  }),
};

/**
 * Helper functions to create numeric expressions
 */
export const NumExpr = {
  literal: (value: number | bigint): NumExpr => ({
    $: "UIntLiteral",
    value: typeof value === "number" ? BigInt(value) : value,
  }),
  blockNumber: (): NumExpr => ({ $: "BlockNumber" }),
  stakeOf: (account: AccountId): NumExpr => ({ $: "StakeOf", account }),
  add: (left: NumExpr, right: NumExpr): NumExpr => ({ $: "Add", left, right }),
  sub: (left: NumExpr, right: NumExpr): NumExpr => ({ $: "Sub", left, right }),
  weightSet: (from: AccountId, to: AccountId): NumExpr => ({
    $: "WeightSet",
    from,
    to,
  }),
  weightPowerFrom: (from: AccountId, to: AccountId): NumExpr => ({
    $: "WeightPowerFrom",
    from,
    to,
  }),
};

/**
 * Helper functions to create boolean expressions
 */
export const BoolExpr = {
  not: (body: BoolExpr): BoolExpr => ({ $: "Not", body }),
  and: (left: BoolExpr, right: BoolExpr): BoolExpr => ({
    $: "And",
    left,
    right,
  }),
  or: (left: BoolExpr, right: BoolExpr): BoolExpr => ({ $: "Or", left, right }),
  comp: (op: CompOp, left: NumExpr, right: NumExpr): BoolExpr => ({
    $: "CompExpr",
    op,
    left,
    right,
  }),
  base: (body: BaseConstraint): BoolExpr => ({ $: "Base", body }),
};