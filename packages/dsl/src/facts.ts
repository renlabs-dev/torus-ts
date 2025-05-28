import type {
  AccountId,
  PermId,
  UInt,
  NumExprType,
  BoolExprType,
  BaseConstraintType,
  Constraint,
  CompOp
} from './types';

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
  type: 'StakeOf';
  account: AccountId;
  amount?: UInt; // Optional: actual value when known
}

export interface WeightSetFact extends Fact {
  type: 'WeightSet';
  from: AccountId;
  to: AccountId;
  amount?: UInt; // Optional: actual value when known
}

export interface WeightPowerFromFact extends Fact {
  type: 'WeightPowerFrom';
  from: AccountId;
  to: AccountId;
  amount?: UInt; // Optional: actual value when known
}

/**
 * Facts about permissions
 */
export interface PermissionExistsFact extends Fact {
  type: 'PermissionExists';
  permId: PermId;
  exists?: boolean; // Optional: actual value when known
}

export interface PermissionEnabledFact extends Fact {
  type: 'PermissionEnabled';
  permId: PermId;
  enabled?: boolean; // Optional: actual value when known
}

export interface MaxDelegationDepthFact extends Fact {
  type: 'MaxDelegationDepth';
  permId: PermId;
  depth: NumExprType;
  actualDepth?: UInt; // Optional: actual value when known
}

export interface InactiveUnlessRedelegatedFact extends Fact {
  type: 'InactiveUnlessRedelegated';
  permId: PermId;
  isRedelegated?: boolean; // Optional: actual value when known
}

/**
 * Block-related facts
 */
export interface BlockFact extends Fact {
  type: 'Block';
  number: UInt;
  timestamp: UInt;
}

/**
 * Union type for all specific facts
 */
export type SpecificFact =
  | StakeOfFact
  | WeightSetFact
  | WeightPowerFromFact
  | PermissionExistsFact
  | PermissionEnabledFact
  | MaxDelegationDepthFact
  | InactiveUnlessRedelegatedFact
  | BlockFact;

/**
 * Comparison request between numeric expressions
 * Note: This is not a fact but a request to perform a comparison
 */
export interface ComparisonFact extends Fact {
  type: 'Comparison';
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
    case 'StakeOf':
      facts.push({
        type: 'StakeOf',
        account: expr.account
      });
      break;
      
    case 'WeightSet':
      facts.push({
        type: 'WeightSet',
        from: expr.from,
        to: expr.to
      });
      break;
      
    case 'WeightPowerFrom':
      facts.push({
        type: 'WeightPowerFrom',
        from: expr.from,
        to: expr.to
      });
      break;
      
    case 'Add':
    case 'Sub':
      // Recursively extract facts from both operands
      facts.push(...extractFactsFromNumExpr(expr.left));
      facts.push(...extractFactsFromNumExpr(expr.right));
      break;
      
    // UIntLiteral and BlockNumber don't represent specific facts about addresses or permissions
    case 'UIntLiteral':
    case 'BlockNumber':
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
  permId: PermId
): SpecificFact[] {
  const facts: SpecificFact[] = [];
  
  switch (constraint.$) {
    case 'MaxDelegationDepth':
      facts.push({
        type: 'MaxDelegationDepth',
        permId,
        depth: constraint.depth
      });
      
      // Also extract facts from the depth expression
      facts.push(...extractFactsFromNumExpr(constraint.depth));
      break;
      
    case 'PermissionExists':
      facts.push({
        type: 'PermissionExists',
        permId: constraint.pid
      });
      break;
      
    case 'PermissionEnabled':
      facts.push({
        type: 'PermissionEnabled',
        permId: constraint.pid
      });
      break;
      
    case 'InactiveUnlessRedelegated':
      facts.push({
        type: 'InactiveUnlessRedelegated',
        permId
      });
      break;
      
    case 'RateLimit':
      // Extract facts from the numeric expressions
      facts.push(...extractFactsFromNumExpr(constraint.maxOperations));
      facts.push(...extractFactsFromNumExpr(constraint.period));
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
  permId: PermId
): (SpecificFact | ComparisonFact)[] {
  const facts: (SpecificFact | ComparisonFact)[] = [];
  
  switch (expr.$) {
    case 'Base':
      facts.push(...extractFactsFromBaseConstraint(expr.body, permId));
      break;
      
    case 'CompExpr':
      // Add the comparison itself as a comparison fact
      facts.push({
        type: 'Comparison',
        op: expr.op,
        left: expr.left,
        right: expr.right
      });
      
      // Also extract facts from both sides of the comparison
      facts.push(...extractFactsFromNumExpr(expr.left));
      facts.push(...extractFactsFromNumExpr(expr.right));
      break;
      
    case 'Not':
      facts.push(...extractFactsFromBoolExpr(expr.body, permId));
      break;
      
    case 'And':
    case 'Or':
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
  constraint: Constraint
): (SpecificFact | ComparisonFact)[] {
  return extractFactsFromBoolExpr(constraint.body, constraint.permId);
}

/**
 * Categorize facts and comparisons by type for easier access
 * @param items Array of facts and comparisons to categorize
 * @returns Object with items categorized by type
 */
export function categorizeFacts(
  items: (SpecificFact | ComparisonFact)[]
): {
  addressFacts: (StakeOfFact | WeightSetFact | WeightPowerFromFact)[];
  permissionFacts: (PermissionExistsFact | PermissionEnabledFact | MaxDelegationDepthFact | InactiveUnlessRedelegatedFact)[];
  comparisonFacts: ComparisonFact[];
} {
  const addressFacts: (StakeOfFact | WeightSetFact | WeightPowerFromFact)[] = [];
  const permissionFacts: (PermissionExistsFact | PermissionEnabledFact | MaxDelegationDepthFact | InactiveUnlessRedelegatedFact)[] = [];
  const comparisonFacts: ComparisonFact[] = [];
  
  for (const item of items) {
    if (item.type === 'StakeOf' || item.type === 'WeightSet' || item.type === 'WeightPowerFrom') {
      addressFacts.push(item as any);
    } else if (item.type === 'Comparison') {
      comparisonFacts.push(item);
    } else if (
      item.type === 'PermissionExists' || 
      item.type === 'PermissionEnabled' || 
      item.type === 'MaxDelegationDepth' || 
      item.type === 'InactiveUnlessRedelegated'
    ) {
      permissionFacts.push(item as any);
    }
  }
  
  return {
    addressFacts,
    permissionFacts,
    comparisonFacts
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