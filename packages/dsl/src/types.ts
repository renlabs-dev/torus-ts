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