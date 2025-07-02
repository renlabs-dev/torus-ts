import type {
  AccountId,
  PermId,
  UInt,
  NumExprType,
  BoolExprType,
  BaseConstraintType,
  Constraint,
  CompOp,
} from "./types";

/**
 * Base type for all facts
 */
export interface Fact {
  type: string;
}

/**
 * Facts about addresses/accounts
 */
export interface StakeOfFact extends Fact {
  type: "StakeOf";
  account: AccountId;
  amount?: UInt; // Optional: actual value when known
}

/**
 * Facts about permissions
 */
export interface PermissionExistsFact extends Fact {
  type: "PermissionExists";
  permId: PermId;
  exists?: boolean; // Optional: actual value when known
}

export interface PermissionEnabledFact extends Fact {
  type: "PermissionEnabled";
  permId: PermId;
  enabled?: boolean; // Optional: actual value when known
}

export interface InactiveUnlessRedelegatedFact extends Fact {
  type: "InactiveUnlessRedelegated";
  account: AccountId;
  percentage: UInt;
  isRedelegated?: boolean; // Optional: actual value when known
}

/**
 * Block-related facts
 */
export interface BlockFact extends Fact {
  type: "Block";
  number: UInt;
  timestamp: UInt;
}

/**
 * Union type for all specific facts
 */
export type SpecificFact =
  | StakeOfFact
  | PermissionExistsFact
  | PermissionEnabledFact
  | InactiveUnlessRedelegatedFact
  | BlockFact;

/**
 * Comparison request between numeric expressions
 * Note: This is not a fact but a request to perform a comparison
 */
export interface ComparisonFact extends Fact {
  type: "Comparison";
  op: CompOp;
  left: NumExprType;
  right: NumExprType;
}

/**
 * Extract specific facts from a numeric expression
 * @param expr The numeric expression to analyze
 * @returns Array of extracted facts
 */
export function extractFactsFromNumExpr(expr: NumExprType): SpecificFact[] {
  const facts: SpecificFact[] = [];

  switch (expr.$) {
    case "StakeOf":
      facts.push({
        type: "StakeOf",
        account: expr.account,
      });
      break;

    case "Add":
    case "Sub":
      // Recursively extract facts from both operands
      facts.push(...extractFactsFromNumExpr(expr.left));
      facts.push(...extractFactsFromNumExpr(expr.right));
      break;

    // UIntLiteral and BlockNumber don't represent specific facts about addresses or permissions
    case "UIntLiteral":
    case "BlockNumber":
      break;
  }

  return facts;
}

/**
 * Extract specific facts from a base constraint
 * @param constraint The base constraint to analyze
 * @param permId The permission ID context
 * @returns Array of extracted facts
 */
export function extractFactsFromBaseConstraint(
  constraint: BaseConstraintType,
): SpecificFact[] {
  const facts: SpecificFact[] = [];

  switch (constraint.$) {
    case "PermissionExists":
      facts.push({
        type: "PermissionExists",
        permId: constraint.pid,
      });
      break;

    case "PermissionEnabled":
      facts.push({
        type: "PermissionEnabled",
        permId: constraint.pid,
      });
      break;

    case "InactiveUnlessRedelegated":
      facts.push({
        type: "InactiveUnlessRedelegated",
        account: constraint.account,
        percentage: constraint.percentage,
      });
      break;
  }

  return facts;
}

/**
 * Extract specific facts and comparisons from a boolean expression
 * @param expr The boolean expression to analyze
 * @param permId The permission ID context
 * @returns Array of extracted facts and comparisons
 */
export function extractFactsFromBoolExpr(
  expr: BoolExprType,
  permId: PermId,
): (SpecificFact | ComparisonFact)[] {
  const facts: (SpecificFact | ComparisonFact)[] = [];

  switch (expr.$) {
    case "Base":
      facts.push(...extractFactsFromBaseConstraint(expr.body));
      break;

    case "CompExpr":
      // Add the comparison itself as a comparison fact
      facts.push({
        type: "Comparison",
        op: expr.op,
        left: expr.left,
        right: expr.right,
      });

      // Also extract facts from both sides of the comparison
      facts.push(...extractFactsFromNumExpr(expr.left));
      facts.push(...extractFactsFromNumExpr(expr.right));
      break;

    case "Not":
      facts.push(...extractFactsFromBoolExpr(expr.body, permId));
      break;

    case "And":
    case "Or":
      facts.push(...extractFactsFromBoolExpr(expr.left, permId));
      facts.push(...extractFactsFromBoolExpr(expr.right, permId));
      break;
  }

  return facts;
}

/**
 * Extract all specific facts and comparisons from a constraint
 * @param constraint The constraint to analyze
 * @returns Array of all extracted facts and comparisons
 */
export function extractFactsFromConstraint(
  constraint: Constraint,
): (SpecificFact | ComparisonFact)[] {
  return extractFactsFromBoolExpr(constraint.body, constraint.permId);
}

/**
 * Categorize facts and comparisons by type for easier access
 * @param items Array of facts and comparisons to categorize
 * @returns Object with items categorized by type
 */
export function categorizeFacts(items: (SpecificFact | ComparisonFact)[]): {
  addressFacts: StakeOfFact[];
  permissionFacts: (
    | PermissionExistsFact
    | PermissionEnabledFact
    | InactiveUnlessRedelegatedFact
  )[];
  comparisonFacts: ComparisonFact[];
} {
  const addressFacts: StakeOfFact[] = [];
  const permissionFacts: (
    | PermissionExistsFact
    | PermissionEnabledFact
    | InactiveUnlessRedelegatedFact
  )[] = [];
  const comparisonFacts: ComparisonFact[] = [];

  for (const item of items) {
    if (item.type === "StakeOf") {
      addressFacts.push(item);
    } else if (item.type === "Comparison") {
      comparisonFacts.push(item);
    } else if (
      item.type === "PermissionExists" ||
      item.type === "PermissionEnabled" ||
      item.type === "InactiveUnlessRedelegated"
    ) {
      permissionFacts.push(item);
    }
  }

  return {
    addressFacts,
    permissionFacts,
    comparisonFacts,
  };
}

/**
 * Deduplicate facts to avoid redundancy
 * @param facts Array of facts to deduplicate
 * @returns Array of unique facts
 */
export function deduplicateFacts<T extends Fact>(facts: T[]): T[] {
  const seen = new Set<string>();
  const uniqueFacts: T[] = [];

  for (const fact of facts) {
    const key = JSON.stringify(fact);
    if (!seen.has(key)) {
      seen.add(key);
      uniqueFacts.push(fact);
    }
  }

  return uniqueFacts;
}
