// Basic type aliases
type Hash = string;
type UInt = bigint;
type AccountId = string;
type Decimal = number;

/**
 * Permission ID - bytestring identifier
 */
type PermId = Hash;

/**
 * Comparison operators for numeric expressions
 */
enum CompOp {
  Gt = "Gt", // Greater than
  Lt = "Lt", // Less than
  Gte = "Gte", // Greater than or equal
  Lte = "Lte", // Less than or equal
  Eq = "Eq", // Equal
}

/**
 * Numeric expression types
 */
type NumExpr =
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
type BaseConstraint =
  | { $: "MaxDelegationDepth"; depth: NumExpr }
  | { $: "PermissionExists"; pid: PermId }
  | { $: "PermissionEnabled"; pid: PermId }
  | { $: "RateLimit"; maxOperations: NumExpr; period: NumExpr }
  | { $: "InactiveUnlessRedelegated" };

/**
 * Boolean expression types
 */
type BoolExpr =
  | { $: "Not"; body: BoolExpr }
  | { $: "And"; left: BoolExpr; right: BoolExpr }
  | { $: "Or"; left: BoolExpr; right: BoolExpr }
  | { $: "CompExpr"; op: CompOp; left: NumExpr; right: NumExpr }
  | { $: "Base"; body: BaseConstraint };

/**
 * Main constraint type
 */
interface Constraint {
  // Refers to the onchain permission that this constraint applies to
  permId: PermId;
  body: BoolExpr;
}

/**
 * Helper functions to create constraint expressions
 */
const Constraint = {
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
const BaseConstraint = {
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
const NumExpr = {
  literal: (value: number | bigint): NumExpr => ({
    $: "UIntLiteral",
    value: typeof value === "number" ? BigInt(value) : value,
  }),
  blockNumber: (): NumExpr => ({ $: "BlockNumber" }),
  stakeOf: (account: AccountId): NumExpr => ({ $: "StakeOf", account }),
  add: (left: NumExpr, right: NumExpr): NumExpr => ({ $: "Add", left, right }),
  sub: (left: NumExpr, right: NumExpr): NumExpr => ({ $: "Sub", left, right }),
};

/**
 * Helper functions to create boolean expressions
 */
const BoolExpr = {
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

// Example: Complex constraint from section 4 of the specification

// "A permission is valid if the grantee has at least 1000 tokens staked, AND either
// the grantor has set a weight of at least 0.3 to the grantee, OR the grantee has
// permission #42 enabled and the current block is past block 2000000."

const complexConstraint = Constraint.create(
  "0x123", // permission ID
  BoolExpr.and(
    // StakeOf(#5D5F..EBnt) >= 1000
    BoolExpr.comp(
      CompOp.Gte,
      NumExpr.stakeOf("5D5F..EBnt"),
      NumExpr.literal(1000)
    ),
    // (WeightSet(...) >= 0.3 OR (PermissionEnabled{42} AND BlockNumber > 2000000))
    BoolExpr.or(
      // WeightSet("allocator2222", #5D5F..EBnt) >= 0.3
      BoolExpr.comp(
        CompOp.Gte,
        { $: "WeightSet", from: "allocator2222", to: "5D5F..EBnt" },
        NumExpr.literal(0.3)
      ),
      // (PermissionEnabled{42} AND BlockNumber > 2000000)
      BoolExpr.and(
        BoolExpr.base(BaseConstraint.permissionEnabled("42")),
        BoolExpr.comp(
          CompOp.Gt,
          NumExpr.blockNumber(),
          NumExpr.literal(2000000)
        )
      )
    )
  )
);






// -----------------------------------------------------------------------------

// =========== Constraints =========== //

// [ Temporal | Weight based | Rate Limit ]

// Type: [After | Before]

// When: [Apr 30 2pm]

// -----------------------------------------------------------------------------

declare function buildTemporalConstraint(type: "After" | "Before", when: Date);

const ct = buildTemporalConstraint("After", new Date("2023-04-30T14:00:00.000Z"));

// sendConstraint(auth, pid, ct);

// -----------------------------------------------------------------------------