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
export type NumExprType =
  | { $: "UIntLiteral"; value: UInt }
  | { $: "BlockNumber" } // current block
  | { $: "StakeOf"; account: AccountId }
  | { $: "Add"; left: NumExprType; right: NumExprType }
  | { $: "Sub"; left: NumExprType; right: NumExprType };
/**
 * Base constraint expressions
 */
export type BaseConstraintType =
  | { $: "PermissionExists"; pid: PermId }
  | { $: "PermissionEnabled"; pid: PermId }
  | { $: "InactiveUnlessRedelegated"; account: AccountId; percentage: UInt }; // Has to be delegated; actually a decimal 0  <= x <= 100

/**
 * Boolean expression types
 */
export type BoolExprType =
  | { $: "Not"; body: BoolExprType }
  | { $: "And"; left: BoolExprType; right: BoolExprType }
  | { $: "Or"; left: BoolExprType; right: BoolExprType }
  | { $: "CompExpr"; op: CompOp; left: NumExprType; right: NumExprType }
  | { $: "Base"; body: BaseConstraintType };

/**
 * Main constraint type
 */
export interface Constraint {
  // Refers to the onchain permission that this constraint applies to
  permId: PermId;
  body: BoolExprType;
}
