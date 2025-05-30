/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unnecessary-condition */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
// We basically need zod schema to be able to lint this correcly
import type {
  AccountId,
  PermId,
  NumExprType,
  Constraint,
  BoolExprType,
  BaseConstraintType
} from './types';
import { CompOp } from './types';
import superjson from 'superjson';
import type {
  Fact,
  StakeOfFact,
  PermissionExistsFact,
  PermissionEnabledFact,
  InactiveUnlessRedelegatedFact,
  BlockFact} from './facts';
import {
  extractFactsFromConstraint,
} from './facts';

/**
 * Generate a hash string for a fact or token, handling BigInt values
 * @param obj The object to hash
 * @returns A string hash
 */
function hashObject(obj: any): string {
  return superjson.stringify(obj);
}

/**
 * Create a consistent hash for a token based on its facts
 * @param token The token to hash
 * @returns A string hash
 */
function hashToken(token: { facts: Map<string, Fact> }): string {
  // Sort fact entries for consistent hashing
  return hashObject(
    Array.from(token.facts.entries())
      .map(([k, v]) => [k, v])
      .sort((a, b) => (a[0] as string).localeCompare(b[0] as string))
  );
}

/**
 * Types of facts for indexing and filtering
 */
export enum FactType {
  Account = 'Account',
  Permission = 'Permission',
  Block = 'Block',
  Operation = 'Operation',
}

/**
 * Index key for alpha network nodes
 */
export type AlphaNodeKey = string;

/**
 * Token that represents a partial match in the beta network
 */
export interface Token {
  facts: Map<string, Fact>;
}

/**
 * Alpha memory to store matching facts
 */
export class AlphaMemory<T extends Fact> {
  // Use a Map for O(1) fact lookup instead of an array
  factsMap = new Map<string, T>();
  
  // Maps from entity IDs to fact keys
  entityToKeyMap = new Map<string, Set<string>>();
  
  successors = new Set<BetaNode>();

  /**
   * Get all facts in this memory
   */
  get facts(): T[] {
    return Array.from(this.factsMap.values());
  }

  /**
   * Add or update a fact in this memory
   * @param fact The fact to add or update
   * @param isUpdate Whether this is an update to an existing fact
   * @returns true if the fact was new, false if it was already in memory
   */
  addFact(fact: T, isUpdate: boolean = false): boolean {
    // Get entity ID for indexing
    const entityId = this.getEntityId(fact);
    
    // Use hashObject to create a consistent key for the fact
    const factKey = hashObject(fact);
    
    // If this is an update, look for existing facts with same entity ID
    if (isUpdate && entityId) {
      // Check if we have existing facts for this entity
      if (this.entityToKeyMap.has(entityId)) {
        const existingKeys = this.entityToKeyMap.get(entityId);
        if (existingKeys === undefined) {throw new Error("never");} // never
        // If we have existing keys, remove them and their facts
        if (existingKeys.size > 0) {
          for (const key of existingKeys) {
            this.factsMap.delete(key);
          }
          
          // Clear the set and add the new key
          existingKeys.clear();
          existingKeys.add(factKey);
        } else {
          // No existing keys, add the new one
          existingKeys.add(factKey);
        }
      } else {
        // No existing entity, create a new set
        this.entityToKeyMap.set(entityId, new Set([factKey]));
      }
      
      // Add the fact
      this.factsMap.set(factKey, fact);
      return true;
    }
    
    // Regular case (not an update or no entity ID)
    
    // Check if we already have this fact
    if (this.factsMap.has(factKey)) {
      return false;
    }
    
    // Add the fact
    this.factsMap.set(factKey, fact);
    
    // Index by entity ID if available
    if (entityId) {
      const set = this.entityToKeyMap.get(entityId) ?? new Set();
      set.add(factKey);
      this.entityToKeyMap.set(entityId, set);
    }
    
    return true;
  }

  /**
   * Activate all successor nodes
   * @param fact The new fact that triggered activation
   */
  activateSuccessors(fact: T): void {
    for (const successor of this.successors) {
      successor.rightActivation(fact);
    }
  }
  
  /**
   * Get an entity ID for a fact to use for indexing
   * @param fact The fact to get an entity ID for
   * @returns The entity ID or an empty string if not applicable
   */
  private getEntityId(fact: T): string {
    if (fact.type === 'StakeOf') {
    
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      return `account:${(fact as any).account}`;
    }
    
    if (
      fact.type === 'PermissionExists' || 
      fact.type === 'PermissionEnabled' || 
      fact.type === 'InactiveUnlessRedelegated'
    ) {
      if ('permId' in fact) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        return `permission:${(fact as any).permId}:${fact.type}`;
      }
    }
    
    return '';
  }
}

/**
 * Alpha node for testing individual facts
 */
export abstract class AlphaNode<T extends Fact> {
  memory: AlphaMemory<T> = new AlphaMemory<T>();

  /**
   * Test if a fact matches this node
   * @param fact The fact to test
   * @returns true if the fact matches, false otherwise
   */
  abstract test(fact: Fact): boolean;

  /**
   * Activate this node with a fact
   * @param fact The fact to test
   * @param isUpdate Whether this is an update to an existing fact
   */
  activate(fact: Fact, isUpdate: boolean = false): void {
    if (this.test(fact)) {
      const typedFact = fact as T;
      // If the fact is new or updated in this memory, activate successors
      if (this.memory.addFact(typedFact, isUpdate)) {
        this.memory.activateSuccessors(typedFact);
      }
    }
  }
}

/**
 * Alpha node for account-related facts
 */
export class AccountAlphaNode extends AlphaNode<StakeOfFact> {
  private readonly accountId: AccountId;
  private readonly factSubtype?: string;

  /**
   * Create an account alpha node
   * @param accountId The account ID to match
   * @param factSubtype Optional fact subtype (StakeOf)
   */
  constructor(accountId: AccountId, factSubtype?: string) {
    super();
    this.accountId = accountId;
    this.factSubtype = factSubtype;
  }

  /**
   * Test if a fact is related to this account
   * @param fact The fact to test
   * @returns true if the fact is related to this account
   */
  test(fact: Fact): boolean {
    // Check if fact type is one of the account-related types
    if (fact.type === 'StakeOf') {
      // If subtype is specified, only match that specific subtype
      if (this.factSubtype && this.factSubtype !== 'StakeOf') {
        return false;
      }
      return (fact as StakeOfFact).account === this.accountId;
    }
    
    return false;
  }
  
  /**
   * Get a key for this node
   * @returns A unique key for this node
   */
  getKey(): AlphaNodeKey {
    return `Account:${this.accountId}:${this.factSubtype ?? 'Any'}`;
  }
}

/**
 * Alpha node for permission-related facts
 */
export class PermissionAlphaNode extends AlphaNode<
  PermissionExistsFact | PermissionEnabledFact | InactiveUnlessRedelegatedFact
> {
  private readonly permId: PermId;
  private readonly factSubtype?: string;

  /**
   * Create a permission alpha node
   * @param permId The permission ID to match
   * @param factSubtype Optional fact subtype
   */
  constructor(permId: PermId, factSubtype?: string) {
    super();
    this.permId = permId;
    this.factSubtype = factSubtype;
  }

  /**
   * Test if a fact is related to this permission
   * @param fact The fact to test
   * @returns true if the fact is related to this permission
   */
  test(fact: Fact): boolean {
    // Check if fact type is one of the permission-related types
    if (
      fact.type === 'PermissionExists' || 
      fact.type === 'PermissionEnabled'
    ) {
      // If subtype is specified, only match that specific subtype
      if (this.factSubtype && this.factSubtype !== fact.type) {
        return false;
      }
      
      if (fact.type === 'PermissionExists') {
        return (fact as PermissionExistsFact).permId === this.permId;
      } else if (fact.type === 'PermissionEnabled') {  // Redundant to be sure. TODO: Use zod and matchs in the future
        return (fact as PermissionEnabledFact).permId === this.permId;
      }
    }
    
    return false;
  }
  
  /**
   * Get a key for this node
   * @returns A unique key for this node
   */
  getKey(): AlphaNodeKey {
    return `Permission:${this.permId}:${this.factSubtype ?? 'Any'}`;
  }
}

/**
 * Block fact for tracking current block information
 */

/**
 * Alpha node for InactiveUnlessRedelegated facts
 */
export class InactiveUnlessRedelegatedAlphaNode extends AlphaNode<InactiveUnlessRedelegatedFact> {
  private readonly accountId: AccountId;

  constructor(accountId: AccountId) {
    super();
    this.accountId = accountId;
  }

  test(fact: Fact): boolean {
    if (fact.type === 'InactiveUnlessRedelegated') {
      return (fact as InactiveUnlessRedelegatedFact).account === this.accountId;
    }
    return false;
  }

  getKey(): AlphaNodeKey {
    return `InactiveUnlessRedelegated:${this.accountId}`;
  }
}

/**
 * Alpha node for block facts
 */
export class BlockAlphaNode extends AlphaNode<BlockFact> {
  test(fact: Fact): boolean {
    return fact.type === 'Block';
  }
  
  getKey(): AlphaNodeKey {
    return 'Block';
  }
}

/**
 * Comparison test to be applied to facts
 */
export interface ComparisonTest {
  op: CompOp;
  left: NumExprType;
  right: NumExprType;
  
  /**
   * Evaluate the comparison
   * @param facts Map of available facts to use in evaluation
   * @returns true if comparison passes, false otherwise
   */
  evaluate(facts: Map<string, Fact>): boolean;
}

/**
 * Beta memory for storing tokens
 */
export class BetaMemory {
  // Use a Map for O(1) token lookup
  tokensMap = new Map<string, Token>();
  parent?: BetaNode;
  successors = new Set<BetaNode | ProductionNode>();

  /**
   * Get all tokens in this memory
   */
  get tokens(): Token[] {
    return Array.from(this.tokensMap.values());
  }

  /**
   * Add a token to this memory
   * @param token The token to add
   * @returns true if the token was new, false if it already existed
   */
  addToken(token: Token): boolean {
    // Create a consistent key for the token based on its facts
    const tokenKey = hashToken(token);
    
    // Check if we already have this token
    if (this.tokensMap.has(tokenKey)) {
      return false;
    }
    
    // Add the token
    this.tokensMap.set(tokenKey, token);
    return true;
  }

  /**
   * Activate all successor nodes
   * @param token The token that triggered activation
   */
  activateSuccessors(token: Token): void {
    for (const successor of this.successors) {
      if ('leftActivation' in successor) {
        // BetaNode
        successor.leftActivation(token);
      } else {
        // ProductionNode
        successor.activate(token);
      }
    }
  }
}

/**
 * Beta node for joining multiple conditions
 */
export class BetaNode {
  leftMemory: BetaMemory;
  rightMemory: AlphaMemory<Fact>;
  memory: BetaMemory = new BetaMemory();
  testFunction?: (leftToken: Token, rightFact: Fact) => boolean;
  
  /**
   * Create a beta node
   * @param leftMemory The left input memory (from beta network)
   * @param rightMemory The right input memory (from alpha network)
   * @param testFunction Optional custom test function for joining
   */
  constructor(
    leftMemory: BetaMemory, 
    rightMemory: AlphaMemory<Fact>,
    testFunction?: (leftToken: Token, rightFact: Fact) => boolean
  ) {
    this.leftMemory = leftMemory;
    this.rightMemory = rightMemory;
    this.testFunction = testFunction;
    
    // Connect this node as a successor
    leftMemory.successors.add(this);
    rightMemory.successors.add(this);
    
    // Set parent reference
    this.memory.parent = this;
  }
  
  /**
   * Check if a token and fact are compatible for joining
   * @param token A token from the left side
   * @param fact A fact from the right side
   * @returns true if they are compatible for joining
   */
  private areCompatible(token: Token, fact: Fact): boolean {
    // Special case: Empty token is compatible with any fact
    if (token.facts.size === 0) {
      return true;
    }
    
    // If there's a custom test function, use it
    if (this.testFunction) {
      return this.testFunction(token, fact);
    }
    
    // If we have no facts in the token, any fact is compatible
    if (token.facts.size === 0) {
      return true;
    }
    
    
    // Default compatibility logic - different fact types are always compatible
    // This is a simplification for our basic implementation to allow heterogeneous joins
    return true;
  }
  
  /**
   * Process a left activation (from beta network)
   * @param token The token from the left input
   */
  leftActivation(token: Token): void {
    // For each fact in right memory, check if it's compatible with token
    for (const fact of this.rightMemory.facts) {
      if (this.areCompatible(token, fact)) {
        // Create a new token with facts from both inputs
        const newToken: Token = {
          facts: new Map(token.facts)
        };
        
        // Add the new fact with a unique key based on its type
        newToken.facts.set(`${fact.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, fact);
        
        // Add to memory and propagate if new
        if (this.memory.addToken(newToken)) {
          this.memory.activateSuccessors(newToken);
        }
      }
    }
  }
  
  /**
   * Process a right activation (from alpha network)
   * @param fact The fact from the right input
   */
  rightActivation(fact: Fact): void {
    // If there are no tokens in left memory, but this is a starting beta node,
    // create a new token with just this fact
    if (this.leftMemory.tokens.length === 0 || 
       (this.leftMemory.tokens.length === 1 && this.leftMemory.tokens[0]?.facts.size === 0)) {
      // This is likely the first beta node - create an initial token
      const newToken: Token = {
        facts: new Map()
      };
      
      // Add the fact with a unique key
      const factKey = `${fact.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      newToken.facts.set(factKey, fact);
      
      // Add to memory and propagate
      if (this.memory.addToken(newToken)) {
        this.memory.activateSuccessors(newToken);
      }
      return;
    }
    
    // For each token in left memory, check if it's compatible with the new fact
    for (const token of this.leftMemory.tokens) {
      // For the first node with a dummy token, always join
      const isDummyToken = token.facts.size === 0;
      
      if (isDummyToken || this.areCompatible(token, fact)) {
        // Create a new token with facts from both inputs
        const newToken: Token = {
          facts: new Map(token.facts)
        };
        
        // Add the new fact with a unique key based on its type
        const factKey = `${fact.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        newToken.facts.set(factKey, fact);
        
        // Add to memory and propagate if new
        if (this.memory.addToken(newToken)) {
          this.memory.activateSuccessors(newToken);
        }
      }
    }
  }
}

/**
 * Evaluates a boolean expression given available facts
 */
function evaluateBoolExpression(expr: BoolExprType, facts: Map<string, Fact>): boolean {
  switch (expr.$) {
    case 'Not':
      // NOT expression - negate the result
      return !evaluateBoolExpression(expr.body, facts);
      
    case 'And':
      // AND expression - both must be true
      return evaluateBoolExpression(expr.left, facts) && 
             evaluateBoolExpression(expr.right, facts);
      
    case 'Or':
      // OR expression - at least one must be true
      return evaluateBoolExpression(expr.left, facts) || 
             evaluateBoolExpression(expr.right, facts);
      
    case 'CompExpr':
      // Comparison expression - evaluate numeric comparison
      { const leftValue = evaluateNumericExpression(expr.left, facts);
      const rightValue = evaluateNumericExpression(expr.right, facts);
      
      if (leftValue === undefined || rightValue === undefined) {
        console.warn('Could not evaluate comparison in boolean expression:', {
          left: leftValue,
          right: rightValue,
          expr
        });
        return false;
      }
      
      return performComparison(expr.op, leftValue, rightValue); }
      
    case 'Base':
      // Base constraint - check specific constraint type
      return evaluateBaseConstraint(expr.body, facts);
      
    default:
      console.warn('Unknown boolean expression type:', (expr));
      return false;
  }
}

/**
 * Evaluates a base constraint given available facts
 */
function evaluateBaseConstraint(constraint: BaseConstraintType, facts: Map<string, Fact>): boolean {
  switch (constraint.$) {
    case 'PermissionExists':
      // Check if permission exists
      for (const fact of facts.values()) {
        if (fact.type === 'PermissionExists') {
          const permFact = fact as PermissionExistsFact;
          if (permFact.permId === constraint.pid && permFact.exists !== undefined) {
            return permFact.exists;
          }
        }
      }
      return false;
      
    case 'PermissionEnabled':
      // Check if permission is enabled
      for (const fact of facts.values()) {
        if (fact.type === 'PermissionEnabled') {
          const permFact = fact as PermissionEnabledFact;
          if (permFact.permId === constraint.pid && permFact.enabled !== undefined) {
            return permFact.enabled;
          }
        }
      }
      return false;
      
    case 'InactiveUnlessRedelegated':
      // Check redelegation status
      for (const fact of facts.values()) {
        if (fact.type === 'InactiveUnlessRedelegated') {
          const redelegatedFact = fact as InactiveUnlessRedelegatedFact;
          if (redelegatedFact.account === constraint.account && 
              redelegatedFact.percentage === constraint.percentage &&
              redelegatedFact.isRedelegated !== undefined) {
            return redelegatedFact.isRedelegated;
          }
        }
      }
      return false;
      
    default:
      console.warn('Unknown base constraint type:', (constraint));
      return false;
  }
}

/**
 * Production node represents a rule activation
 */
export class ProductionNode {
  constraint: Constraint;
  activations = new Map<string, Token>();
  comparisonTests: ComparisonTest[] = [];

  /**
   * Create a production node
   * @param constraint The constraint that this node represents
   * @param comparisonTests Optional comparison tests to apply to tokens
   */
  constructor(constraint: Constraint, comparisonTests: ComparisonTest[] = []) {
    this.constraint = constraint;
    this.comparisonTests = comparisonTests;
  }

  /**
   * Activate this production node
   * @param token The token that triggered activation
   */
  activate(token: Token): void {
    // Evaluate the boolean expression using the token's facts
    const expressionResult = evaluateBoolExpression(this.constraint.body, token.facts);
    
    // Only activate if the expression evaluates to true
    if (!expressionResult) {
      return; // Expression evaluated to false, don't activate
    }
    
    // Create a consistent key for the token
    const tokenKey = hashToken(token);
    
    // Add to activations if not already present
    if (!this.activations.has(tokenKey)) {
      this.activations.set(tokenKey, token);
    }
  }

  /**
   * Get the constraint ID for this production node
   */
  getConstraintId(): string {
    return this.constraint.permId;
  }
  
  /**
   * Get all activation tokens
   */
  getActivations(): Token[] {
    return Array.from(this.activations.values());
  }
}

/**
 * Creates a comparison test from a comparison fact
 * @param comparison The comparison description
 * @returns A comparison test function
 */
/**
 * Evaluates a numeric expression using available facts
 */
function evaluateNumericExpression(expr: NumExprType, facts: Map<string, Fact>): bigint | undefined {
  switch (expr.$) {
    case 'UIntLiteral':
      return BigInt(expr.value);
      
    case 'BlockNumber':
      // Find the current block fact
      for (const fact of facts.values()) {
        if (fact.type === 'Block') {
          const blockFact = fact as BlockFact;
          return blockFact.number;
        }
      }
      return undefined;
      
    case 'StakeOf':
      // Find the stake fact for this account
      for (const fact of facts.values()) {
        if (fact.type === 'StakeOf') {
          const stakeFact = fact as StakeOfFact;
          if (stakeFact.account === expr.account && stakeFact.amount !== undefined) {
            return BigInt(stakeFact.amount);
          }
        }
      }
      return undefined;
      
    case 'Add':
      { const leftAdd = evaluateNumericExpression(expr.left, facts);
      const rightAdd = evaluateNumericExpression(expr.right, facts);
      if (leftAdd !== undefined && rightAdd !== undefined) {
        return leftAdd + rightAdd;
      }
      return undefined; }
      
    case 'Sub':
      { const leftSub = evaluateNumericExpression(expr.left, facts);
      const rightSub = evaluateNumericExpression(expr.right, facts);
      if (leftSub !== undefined && rightSub !== undefined) {
        return leftSub - rightSub;
      }
      return undefined; }
      
    default:
      console.warn('Unknown numeric expression type:', (expr));
      return undefined;
  }
}

/**
 * Performs a comparison between two bigint values
 */
function performComparison(op: CompOp, left: bigint, right: bigint): boolean {
  switch (op) {
    case CompOp.Lt:
      return left < right;
    case CompOp.Lte:
      return left <= right;
    case CompOp.Gt:
      return left > right;
    case CompOp.Gte:
      return left >= right;
    case CompOp.Eq:
      return left === right;
    default:
      console.warn('Unknown comparison operator:', op);
      return false;
  }
}

/**
 * Working memory for the Rete network
 */
export class WorkingMemory {
  // Account facts indexed by AccountId
  accountFacts = new Map<AccountId, Map<string, Fact>>();
  
  // Permission facts indexed by PermId
  permissionFacts = new Map<PermId, Map<string, Fact>>();
  
  // Current block information
  currentBlock?: BlockFact;
  
  // Operation facts indexed by PermId and timestamp
  operationFacts = new Map<PermId, Fact[]>();
  
  /**
   * Add or update a fact in working memory
   * @param fact The fact to add or update
   * @returns An object containing whether the fact was added/updated and the final fact object
   */
  addOrUpdateFact(fact: Fact): { isNew: boolean, updated: boolean, fact: Fact } {
    if (fact.type === 'StakeOf') {
      return this.addOrUpdateAccountFact(fact as StakeOfFact);
    } else if (
      fact.type === 'PermissionExists' || 
      fact.type === 'PermissionEnabled'
    ) {
      return this.addOrUpdatePermissionFact(fact as (PermissionExistsFact | PermissionEnabledFact));
    } else if (fact.type === 'InactiveUnlessRedelegated') {
      return this.addOrUpdateInactiveUnlessRedelegatedFact(fact as InactiveUnlessRedelegatedFact);
    } else if (fact.type === 'Block') {
      return this.updateCurrentBlock(fact as BlockFact);
    } else {
      // Unknown fact type
      return { isNew: false, updated: false, fact };
    }
  }
  
  /**
   * Add a fact to working memory
   * @param fact The fact to add
   * @returns true if the fact was new, false if it already existed
   */
  addFact(fact: Fact): boolean {
    const result = this.addOrUpdateFact(fact);
    return result.isNew;
  }
  
  /**
   * Add or update an account fact
   * @param fact The account fact to add or update
   * @returns Result object with isNew, updated flags and the final fact
   */
  private addOrUpdateAccountFact(fact: StakeOfFact): { isNew: boolean, updated: boolean, fact: StakeOfFact } {
    const { account } = fact;
    
    // Get or create the map for this account
    if (!this.accountFacts.has(account)) {
      const newAccountMap = new Map();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      this.accountFacts.set(account, newAccountMap);
      
      const factKey = hashObject(fact);
      newAccountMap.set(factKey, fact);
      
      return { isNew: true, updated: false, fact };
  }
    
    const accountMap = this.accountFacts.get(account)!;
    
    // Check if we already have a StakeOf fact for this account
    for (const [key, existingFact] of accountMap.entries()) {
      if (existingFact.type === 'StakeOf') {
        // Found existing StakeOf fact - update it
        const stakeOfFact = existingFact as StakeOfFact;
        
        // Check if values actually changed
        if (stakeOfFact.amount === fact.amount) {
          return { isNew: false, updated: false, fact: stakeOfFact };
        }
        
        // Update the amount
        stakeOfFact.amount = fact.amount;
        
        // Remove old key and add with new key (since the hash may have changed)
        accountMap.delete(key);
        const newKey = hashObject(stakeOfFact);
        accountMap.set(newKey, stakeOfFact);
        
        return { isNew: false, updated: true, fact: stakeOfFact };
      }
    }
    
    // No existing StakeOf fact found, add a new one
    const factKey = hashObject(fact);
    accountMap.set(factKey, fact);
    
    return { isNew: true, updated: false, fact };
  }
  
  /**
   * Add an account fact (legacy method)
   * @param fact The account fact to add
   * @returns true if the fact was new, false otherwise
   */
  private addAccountFact(fact: StakeOfFact): boolean {
    return this.addOrUpdateAccountFact(fact).isNew;
  }
  
  
  /**
   * Add or update a permission fact
   * @param fact The permission fact to add or update
   * @returns Result object with isNew, updated flags and the final fact
   */
  private addOrUpdatePermissionFact(
    fact: PermissionExistsFact | PermissionEnabledFact
  ): { 
    isNew: boolean, 
    updated: boolean, 
    fact: PermissionExistsFact | PermissionEnabledFact 
  } {
    const permId = fact.permId;
    
    // Get or create the map for this permission
    if (!this.permissionFacts.has(permId)) {
      this.permissionFacts.set(permId, new Map());
      
      // New permission, just add the fact
      const permMap = this.permissionFacts.get(permId)!;
      const factKey = hashObject(fact);
      permMap.set(factKey, fact);
      
      return { isNew: true, updated: false, fact };
    }
    
    const permMap = this.permissionFacts.get(permId)!;
    
    // Check if we already have a fact of this type for this permission
    for (const [key, existingFact] of permMap.entries()) {
      if (existingFact.type === fact.type) {
        // Found existing fact - update it
        let hasChanged = false;
        
        // Update based on fact type
        if (fact.type === 'PermissionExists') {
          const existingPermFact = existingFact as PermissionExistsFact;
          const newPermFact = fact;
          
          if (existingPermFact.exists !== newPermFact.exists) {
            existingPermFact.exists = newPermFact.exists;
            hasChanged = true;
          }
        } else if (fact.type === 'PermissionEnabled') { // explicity should be match
          const existingPermFact = existingFact as PermissionEnabledFact;
          const newPermFact = fact;
          
          if (existingPermFact.enabled !== newPermFact.enabled) {
            existingPermFact.enabled = newPermFact.enabled;
            hasChanged = true;
          }
        }
        
        if (!hasChanged) {
          return { isNew: false, updated: false, fact: existingFact as any };
        }
        
        // Remove old key and add with new key (since the hash may have changed)
        permMap.delete(key);
        const newKey = hashObject(existingFact);
        permMap.set(newKey, existingFact);
        
        return { 
          isNew: false, 
          updated: true, 
          fact: existingFact as PermissionExistsFact | PermissionEnabledFact 
        };
      }
    }
    
    // No existing fact of this type found, add a new one
    const factKey = hashObject(fact);
    permMap.set(factKey, fact);
    
    return { isNew: true, updated: false, fact };
  }
  
  /**
   * Add or update an InactiveUnlessRedelegated fact
   * @param fact The InactiveUnlessRedelegated fact to add or update
   * @returns Result object with isNew, updated flags and the final fact
   */
  private addOrUpdateInactiveUnlessRedelegatedFact(
    fact: InactiveUnlessRedelegatedFact
  ): { 
    isNew: boolean, 
    updated: boolean, 
    fact: InactiveUnlessRedelegatedFact 
  } {
    const { account } = fact;
    
    // Get or create the map for this account
    if (!this.accountFacts.has(account)) {
      this.accountFacts.set(account, new Map());
      
      // New account, just add the fact
      const accountMap = this.accountFacts.get(account)!;
      const factKey = hashObject(fact);
      accountMap.set(factKey, fact);
      
      return { isNew: true, updated: false, fact };
    }
    
    const accountMap = this.accountFacts.get(account)!;
    
    // Check if we already have an InactiveUnlessRedelegated fact for this account
    for (const [key, existingFact] of accountMap.entries()) {
      if (existingFact.type === 'InactiveUnlessRedelegated') {
        const existingInactiveFact = existingFact as InactiveUnlessRedelegatedFact;
        
        // Check if values actually changed
        if (existingInactiveFact.percentage === fact.percentage && 
            existingInactiveFact.isRedelegated === fact.isRedelegated) {
          return { isNew: false, updated: false, fact: existingInactiveFact };
        }
        
        // Update the values
        existingInactiveFact.percentage = fact.percentage;
        existingInactiveFact.isRedelegated = fact.isRedelegated;
        
        // Remove old key and add with new key (since the hash may have changed)
        accountMap.delete(key);
        const newKey = hashObject(existingInactiveFact);
        accountMap.set(newKey, existingInactiveFact);
        
        return { isNew: false, updated: true, fact: existingInactiveFact };
      }
    }
    
    // No existing InactiveUnlessRedelegated fact found, add a new one
    const factKey = hashObject(fact);
    accountMap.set(factKey, fact);
    
    return { isNew: true, updated: false, fact };
  }

  /**
   * Add a permission fact (legacy method)
   * @param fact The permission fact to add
   * @returns true if the fact was new, false otherwise
   */
  private addPermissionFact(
    fact: PermissionExistsFact | PermissionEnabledFact
  ): boolean {
    return this.addOrUpdatePermissionFact(fact).isNew;
  }
  
  /**
   * Update the current block information
   * @param blockFact The block fact
   * @returns Result object with isNew, updated flags and the final fact
   */
  private updateCurrentBlock(blockFact: BlockFact): 
    { isNew: boolean, updated: boolean, fact: BlockFact } {
    const wasNew = !this.currentBlock;
    const wasUpdated = this.currentBlock && 
      (this.currentBlock.number !== blockFact.number || this.currentBlock.timestamp !== blockFact.timestamp);
    
    // Always replace current block
    this.currentBlock = blockFact;
    
    return { 
      isNew: wasNew ?? false, 
      updated: wasUpdated ?? false, 
      fact: blockFact 
    };
  }
  
  
  /**
   * Get all facts for a specific account
   * @param accountId The account ID
   * @returns Array of facts for the account
   */
  getAccountFacts(accountId: AccountId): Fact[] {
    const accountMap = this.accountFacts.get(accountId);
    return accountMap ? Array.from(accountMap.values()) : [];
  }
  
  /**
   * Get all facts for a specific permission
   * @param permId The permission ID
   * @returns Array of facts for the permission
   */
  getPermissionFacts(permId: PermId): Fact[] {
    const permMap = this.permissionFacts.get(permId);
    return permMap ? Array.from(permMap.values()) : [];
  }
  
  /**
   * Get all facts in working memory
   * @returns Array of all facts
   */
  getAllFacts(): Fact[] {
    const allFacts: Fact[] = [];
    
    // Add account facts
    for (const [_, accountMap] of this.accountFacts.entries()) {
      allFacts.push(...accountMap.values());
    }
    
    // Add permission facts
    for (const [_, permMap] of this.permissionFacts.entries()) {
      allFacts.push(...permMap.values());
    }
    
    // Add current block
    if (this.currentBlock) {
      allFacts.push(this.currentBlock);
    }
    
    // Add operation facts
    for (const [_, opFacts] of this.operationFacts.entries()) {
      allFacts.push(...opFacts);
    }
    
    return allFacts;
  }
}

/**
 * Rete network for efficient constraint evaluation
 */
export class ReteNetwork {
  // Alpha network (indexed by node key)
  private alphaNodes = new Map<string, AlphaNode<Fact>>();
  
  // Beta network
  private betaNodes: BetaNode[] = [];
  
  // Production nodes (indexed by node ID)
  private productionNodes = new Map<string, ProductionNode>();
  
  // Working memory
  private workingMemory: WorkingMemory = new WorkingMemory();
  
  // Constraint state tracking for enforcement
  private constraintStates = new Map<string, boolean | undefined>(); // undefined = never evaluated
  private onConstraintViolated?: (constraintId: string) => Promise<void>;
  
  /**
   * Create a new ReteNetwork instance
   * @param onConstraintViolated Optional callback for when constraints become violated
   */
  constructor(onConstraintViolated?: (constraintId: string) => Promise<void>) {
    this.onConstraintViolated = onConstraintViolated;
  }

  /**
   * Set the constraint violation handler
   * @param handler Callback function to call when a constraint becomes violated
   */
  setViolationHandler(handler: (constraintId: string) => Promise<void>): void {
    this.onConstraintViolated = handler;
  }

  /**
   * Update constraint states for all production nodes
   */
  private updateAllConstraintStates(): void {
    for (const [constraintId, productionNode] of this.productionNodes) {
      const currentlyActivated = productionNode.getActivations().length > 0;
      this.constraintStates.set(constraintId, currentlyActivated);
    }
  }

  /**
   * Create a deterministic constraint ID based on constraint content
   * @param constraint The constraint to create an ID for
   * @returns A deterministic constraint ID
   */
  private createConstraintId(constraint: Constraint): string {
    // Create a stable hash based on constraint content, not timestamp
    const constraintContent = {
      permId: constraint.permId,
      body: constraint.body
    };
    
    // Use a simple but deterministic hash of the constraint content
    const contentString = superjson.stringify(constraintContent);
    let hash = 0;
    for (let i = 0; i < contentString.length; i++) {
      const char = contentString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Make it positive and convert to hex for readability
    const positiveHash = Math.abs(hash).toString(16);
    return `constraint_${constraint.permId.slice(2, 10)}_${positiveHash}`;
  }

  /**
   * Create a deterministic beta node registry key
   * @param leftNodeKey Key identifying the left input node
   * @param rightNodeKey Key identifying the right input node  
   * @returns A deterministic beta node key
   */
  private createBetaNodeKey(leftNodeKey: string, rightNodeKey: string): string {
    return `beta_${leftNodeKey}_${rightNodeKey}`;
  }

  /**
   * Beta node registry for reusing beta nodes with same inputs
   */
  private betaNodeRegistry = new Map<string, BetaNode>();

  /**
   * Get or create a beta node for the given inputs
   * @param leftMemory The left input memory
   * @param rightMemory The right input memory
   * @param leftKey Identifying key for left input
   * @param rightKey Identifying key for right input
   * @returns The beta node for these inputs
   */
  private getOrCreateBetaNode(
    leftMemory: BetaMemory,
    rightMemory: AlphaMemory<Fact>,
    leftKey: string,
    rightKey: string
  ): BetaNode {
    const betaKey = this.createBetaNodeKey(leftKey, rightKey);
    
    let betaNode = this.betaNodeRegistry.get(betaKey);
    if (!betaNode) {
      // Create new beta node and register it
      betaNode = new BetaNode(leftMemory, rightMemory);
      this.betaNodeRegistry.set(betaKey, betaNode);
      this.betaNodes.push(betaNode);
      
      console.log(`Created new beta node: ${betaKey}`);
    } else {
      console.log(`Reusing existing beta node: ${betaKey}`);
    }
    
    return betaNode;
  }

  /**
   * Add a constraint to the Rete network
   * @param constraint The constraint to add
   * @returns The ID of the production node
   */
  addConstraint(constraint: Constraint): string {
    // Create deterministic constraint ID
    const constraintId = this.createConstraintId(constraint);
    
    // Check if we already have a production node for this exact constraint
    if (this.productionNodes.has(constraintId)) {
      console.log(`Reusing existing production node for constraint: ${constraintId}`);
      return constraintId;
    }
    // Extract all facts from the constraint (including those in comparisons)
    const allFacts = extractFactsFromConstraint(constraint);
    
    // Filter out comparison facts - we handle those differently now
    const facts = allFacts.filter(f => f.type !== 'Comparison');
    
    // Get or create alpha nodes for each fact type
    const alphaNodes: AlphaNode<Fact>[] = [];
    const alphaNodeKeys: string[] = [];
    
    // Process each fact to create appropriate alpha nodes
    for (const fact of facts) {
      let alphaNode: AlphaNode<Fact> | undefined;
      let alphaKey: string;
      
      if (fact.type === 'StakeOf') {
        // StakeOf fact - index by account
        alphaKey = `Account:${fact.account}:StakeOf`;
        alphaNode = this.alphaNodes.get(alphaKey)!;
        
        if (!alphaNode) {
          alphaNode = new AccountAlphaNode(fact.account, 'StakeOf');
          this.alphaNodes.set(alphaKey, alphaNode);
        }
      } else if (
        fact.type === 'PermissionExists' || 
        fact.type === 'PermissionEnabled'
      ) {
        // Permission fact - index by permId
        const permId = fact.permId;
        
        alphaKey = `Permission:${permId}:${fact.type}`;
        alphaNode = this.alphaNodes.get(alphaKey)!;
        
        if (!alphaNode) {
          alphaNode = new PermissionAlphaNode(permId, fact.type);
          this.alphaNodes.set(alphaKey, alphaNode);
        }
      } else if (fact.type === 'InactiveUnlessRedelegated') {
        // InactiveUnlessRedelegated fact - index by account
        const account = fact.account;
        
        alphaKey = `InactiveUnlessRedelegated:${account}`;
        alphaNode = this.alphaNodes.get(alphaKey)!;
        
        if (!alphaNode) {
          alphaNode = new InactiveUnlessRedelegatedAlphaNode(account);
          this.alphaNodes.set(alphaKey, alphaNode);
        }
      } else if (fact.type === 'Block') {
        // Block fact - one global node
        alphaKey = 'Block';
        alphaNode = this.alphaNodes.get(alphaKey)!;
        
        if (!alphaNode) {
          alphaNode = new BlockAlphaNode();
          this.alphaNodes.set(alphaKey, alphaNode);
        }
      } else {
        // Unknown fact type, skip
        continue;
      }
      
      if (alphaNode) {
        alphaNodes.push(alphaNode);
        alphaNodeKeys.push(alphaKey);
      }
    }
    
    // If we have multiple facts, create a beta network with reuse
    let productionNode: ProductionNode;
    
    if (alphaNodes.length === 0) {
      // No facts, just create a production node
      productionNode = new ProductionNode(constraint);
    } else if (alphaNodes.length === 1) {
      // Single fact case - create a production node directly connected to the alpha node
      productionNode = new ProductionNode(constraint);
      
      // Create a simple adapter to connect alpha to production
      const dummyMemory = new BetaMemory();
      const firstAlphaNode = alphaNodes[0];
      if (!firstAlphaNode) {
        throw new Error('No alpha nodes found for constraint');
      }
      
      // Use deterministic beta node creation
      const singleFactBeta = this.getOrCreateBetaNode(
        dummyMemory, 
        firstAlphaNode.memory, 
        'dummy', 
        alphaNodeKeys[0]!
      );
      
      // Add initial empty token to start (only if memory is empty)
      if (dummyMemory.tokens.length === 0) {
        dummyMemory.addToken({ facts: new Map() });
      }
      
      // Connect the beta node to the production node
      singleFactBeta.memory.successors.add(productionNode);
      
      // Process existing facts in this alpha node
      for (const fact of alphaNodes[0]?.memory.facts ?? []) {
        singleFactBeta.rightActivation(fact);
      }
    } else {
      // Multiple facts - build a beta network with reuse
      
      // Create the first beta node with a dummy left input
      const dummyMemory = new BetaMemory();
      if (dummyMemory.tokens.length === 0) {
        dummyMemory.addToken({ facts: new Map() });
      }
      
      let previousNode = this.getOrCreateBetaNode(
        dummyMemory, 
        alphaNodes[0]!.memory, 
        'dummy', 
        alphaNodeKeys[0]!
      );
      
      // Process existing facts in the first alpha node
      for (const fact of alphaNodes[0]?.memory.facts ?? []) {
        previousNode.rightActivation(fact);
      }
      
      // Chain the rest of the alpha nodes through beta nodes with reuse
      for (let i = 1; i < alphaNodes.length; i++) {
        const previousKey = i === 1 ? 
          this.createBetaNodeKey('dummy', alphaNodeKeys[0]!) : 
          this.createBetaNodeKey(
            this.createBetaNodeKey('dummy', alphaNodeKeys[0]!),
            alphaNodeKeys[i - 1]!
          );
        
        const currentNode = this.getOrCreateBetaNode(
          previousNode.memory, 
          alphaNodes[i]!.memory, 
          previousKey, 
          alphaNodeKeys[i]!
        );
        
        // Process existing facts in this alpha node
        for (const fact of alphaNodes[i]?.memory.facts ?? []) {
          currentNode.rightActivation(fact);
        }
        
        previousNode = currentNode;
      }
      
      // Create the production node and connect it to the final beta node
      productionNode = new ProductionNode(constraint);
      previousNode.memory.successors.add(productionNode);
      
      // Activate production node with any existing tokens
      for (const token of previousNode.memory.tokens) {
        productionNode.activate(token);
      }
    }
    
    // Register the production node with deterministic ID
    this.productionNodes.set(constraintId, productionNode);
    
    // Initialize constraint state as undefined (never evaluated)
    this.constraintStates.set(constraintId, undefined);
    
    // Update constraint states for all constraints (in case this constraint was added to existing network)
    this.updateAllConstraintStates();
    
    console.log(`Added constraint with deterministic ID: ${constraintId}`);
    return constraintId;
  }
  
  /**
   * Process a fact through the network
   * @param fact The fact to process
   * @param isUpdate Whether this is an update to an existing fact
   */
  private processFact(fact: Fact, isUpdate: boolean = false): void {
    // Activate all alpha nodes with the isUpdate flag
    for (const [_, alphaNode] of this.alphaNodes.entries()) {
      alphaNode.activate(fact, isUpdate);
    }
  }
  
  /**
   * Add a fact to the network
   * @param fact The fact to add
   */
  /**
   * Add or update a fact in the network
   * @param fact The fact to add or update
   * @param isUpdate Whether this is an update to an existing fact (default: auto-detect)
   * @returns true if the fact was added/updated, false otherwise
   */
  /**
   * Add or update a fact in the network
   * @param fact The fact to add or update
   * @returns An object with information about the operation result
   */
  async addFact(fact: Fact): Promise<{ isNew: boolean, updated: boolean }> {
    // Store previous constraint states for violation detection
    const previousStates = new Map(this.constraintStates);
    
    // Add or update the fact in working memory
    const result = this.workingMemory.addOrUpdateFact(fact);
    
    // Process the fact through the network if it's new or updated
    if (result.isNew || result.updated) {
      // Process the fact through the network
      this.processFact(result.fact, result.updated);
      
      // Check for constraint violations if we have a violation handler
      if (this.onConstraintViolated) {
        for (const [constraintId, productionNode] of this.productionNodes) {
          const currentlyActivated = productionNode.getActivations().length > 0;
          const currentState = currentlyActivated; // true = satisfied, false = violated
          const previousState = previousStates.get(constraintId);
          
          // Check if constraint transitioned from satisfied/unknown to violated
          if (previousState !== false && currentState === false) {
            // Constraint became violated - call the violation handler
            try {
              await this.onConstraintViolated(constraintId);
            } catch (error) {
              // Log error but don't stop processing
              console.error(`Error in constraint violation handler for ${constraintId}:`, error);
            }
          }
          
          // Update the constraint state
          this.constraintStates.set(constraintId, currentState);
        }
      }
    }
    
    return { isNew: result.isNew, updated: result.updated };
  }
    

  /**
   * Add multiple facts to the network
   * @param facts The facts to add
   */
  /**
   * Add or update multiple facts in the network
   * @param facts The facts to add or update
   * @returns Array of results for each fact
   */
  async addFacts(facts: Fact[]): Promise<{ isNew: boolean, updated: boolean }[]> {
    const results: { isNew: boolean, updated: boolean }[] = [];
    
    for (const fact of facts) {
      results.push(await this.addFact(fact));
    }
    
    return results;
  }
  
  /**
   * Check if a constraint is activated
   * @param productionId The ID of the production node
   * @returns true if the constraint is activated, false otherwise
   */
  isConstraintActivated(productionId: string): boolean {
    const productionNode = this.productionNodes.get(productionId);
    return productionNode !== undefined && productionNode.getActivations().length > 0;
  }
  
  /**
   * Get all activations for a constraint
   * @param productionId The ID of the production node
   * @returns Array of tokens that activated the constraint
   */
  getConstraintActivations(productionId: string): Token[] {
    const productionNode = this.productionNodes.get(productionId);
    return productionNode ? productionNode.getActivations() : [];
  }
  
  /**
   * Get all constraints that are currently activated
   * @returns Map of constraint ID to constraint
   */
  getActivatedConstraints(): Map<string, Constraint> {
    const activatedConstraints = new Map<string, Constraint>();
    
    for (const [id, node] of this.productionNodes.entries()) {
      if (node.getActivations().length > 0) {
        activatedConstraints.set(id, node.constraint);
      }
    }
    
    return activatedConstraints;
  }

  /**
   * Get all facts currently in the working memory
   * @returns Array of all facts
   */
  getFacts(): Fact[] {
    return this.workingMemory.getAllFacts();
  }

  /**
   * Find constraints by permission ID
   * @param permissionId The permission ID to search for
   * @returns Array of constraint IDs for the given permission
   */
  getConstraintsByPermissionId(permissionId: PermId): string[] {
    const constraintIds: string[] = [];
    
    for (const [id, node] of this.productionNodes.entries()) {
      if (node.constraint.permId === permissionId) {
        constraintIds.push(id);
      }
    }
    
    return constraintIds;
  }

  /**
   * Remove a constraint from the network
   * @param constraintId The ID of the constraint to remove
   * @returns true if the constraint was removed, false if it didn't exist
   */
  removeConstraint(constraintId: string): boolean {
    const productionNode = this.productionNodes.get(constraintId);
    if (!productionNode) {
      return false; // Constraint doesn't exist
    }

    // Remove the production node
    this.productionNodes.delete(constraintId);
    
    // Remove constraint state tracking
    this.constraintStates.delete(constraintId);
    
    // TODO: Implement proper cleanup of alpha/beta network nodes
    // For now, we'll leave the network structure intact to avoid breaking other constraints
    // In a full implementation, we'd need to:
    // 1. Check if other constraints use the same alpha nodes
    // 2. Remove unused alpha nodes
    // 3. Remove unused beta nodes
    // 4. Update network connections
    
    console.log(`Removed constraint: ${constraintId}`);
    return true;
  }

  /**
   * Get the evaluation status of a constraint
   * @param productionId The ID of the production node
   * @returns 'satisfied' if constraint is met, 'violated' if not met, 'unknown' if never evaluated
   */
  getConstraintEvaluationStatus(productionId: string): 'satisfied' | 'violated' | 'unknown' {
    const productionNode = this.productionNodes.get(productionId);
    if (!productionNode) {
      return 'unknown'; // Production node doesn't exist
    }

    const state = this.constraintStates.get(productionId);
    if (state === undefined) {
      return 'unknown'; // Never been evaluated
    }
    
    return state ? 'satisfied' : 'violated';
  }

  /**
   * Get detailed constraint status information
   * @param productionId The ID of the production node
   * @returns Detailed status information about the constraint
   */
  getConstraintStatus(productionId: string): {
    exists: boolean;
    status: 'satisfied' | 'violated' | 'unknown';
    activationCount: number;
    hasActivations: boolean;
    constraint?: Constraint;
  } {
    const productionNode = this.productionNodes.get(productionId);
    if (!productionNode) {
      return {
        exists: false,
        status: 'unknown',
        activationCount: 0,
        hasActivations: false
      };
    }

    const activations = productionNode.getActivations();
    const state = this.constraintStates.get(productionId);
    
    return {
      exists: true,
      status: state === undefined ? 'unknown' : (state ? 'satisfied' : 'violated'),
      activationCount: activations.length,
      hasActivations: activations.length > 0,
      constraint: productionNode.constraint
    };
  }
  
  /**
   * Generate a visualization of the network structure
   * @returns A string representation of the network
   */
  visualizeNetwork(): string {
    let visualization = "=== RETE NETWORK VISUALIZATION ===\n\n";
    
    // Alpha nodes
    visualization += "ALPHA NODES:\n";
    for (const [key, node] of this.alphaNodes.entries()) {
      visualization += `  ${key}:\n`;
      visualization += `    Facts in memory: ${node.memory.facts.length}\n`;
      if (node.memory.facts.length > 0) {
        visualization += "    Facts:\n";
        node.memory.facts.forEach((fact, index) => {
          visualization += `      Fact #${index + 1}: ${fact.type}\n`;
        });
      }
      visualization += `    Successors: ${node.memory.successors.size}\n`;
    }
    
    // Beta nodes
    visualization += "\nBETA NODES:\n";
    this.betaNodes.forEach((node, index) => {
      visualization += `  Beta Node #${index + 1}:\n`;
      
      // Count unique fact combinations (ignoring keys which have timestamps)
      const uniqueCombinations = new Set<string>();
      node.memory.tokens.forEach(token => {
        // Create a representation of just the fact types and their identifying properties
        const factSummary = Array.from(token.facts.values())
          .map(fact => {
            if (fact.type === 'StakeOf') {
              return `StakeOf:${(fact as StakeOfFact).account}:${(fact as StakeOfFact).amount}`;
            } else if (fact.type === 'PermissionExists' || fact.type === 'PermissionEnabled') {
              return `${fact.type}:${(fact as PermissionExistsFact | PermissionEnabledFact).permId}`;
            } else if (fact.type === 'InactiveUnlessRedelegated') {
              const iur = fact as InactiveUnlessRedelegatedFact;
              return `${fact.type}:${iur.account}:${iur.percentage}`;
            } else {
              return fact.type;
            }
          })
          .sort()
          .join('|');
        
        uniqueCombinations.add(factSummary);
      });
      
      visualization += `    Tokens in memory: ${node.memory.tokens.length} (${uniqueCombinations.size} unique combinations)\n`;
      
      if (node.memory.tokens.length > 0) {
        visualization += "    Sample token facts:\n";
        const sampleToken = node.memory.tokens[0];
        if (sampleToken) {
          Array.from(sampleToken.facts.entries()).forEach(([key, fact]) => {
            visualization += `      ${key}: ${fact.type}\n`;
          });
        }
      }
      visualization += `    Successors: ${node.memory.successors.size}\n`;
    });
    
    // Production nodes
    visualization += "\nPRODUCTION NODES:\n";
    for (const [id, node] of this.productionNodes.entries()) {
      visualization += `  ${id}:\n`;
      visualization += `    Constraint ID: ${node.constraint.permId}\n`;
      
      // Count unique activations
      const activations = node.getActivations();
      const uniqueActivations = new Set<string>();
      activations.forEach(token => {
        // Create a representation of just the fact types and their identifying properties
        const factSummary = Array.from(token.facts.values())
          .map(fact => {
            if (fact.type === 'StakeOf') {
              return `StakeOf:${(fact as StakeOfFact).account}:${(fact as StakeOfFact).amount}`;
            } else if (fact.type === 'PermissionExists' || fact.type === 'PermissionEnabled') {
              return `${fact.type}:${(fact as PermissionExistsFact | PermissionEnabledFact).permId}`;
            } else if (fact.type === 'InactiveUnlessRedelegated') {
              const iur = fact as InactiveUnlessRedelegatedFact;
              return `${fact.type}:${iur.account}:${iur.percentage}`;
            } else {
              return fact.type;
            }
          })
          .sort()
          .join('|');
        
        uniqueActivations.add(factSummary);
      });
      
      visualization += `    Activations: ${activations.length} (${uniqueActivations.size} unique combinations)\n`;
      
      // Show the most recent activation
      if (activations.length > 0) {
        visualization += "    Most recent activation facts:\n";
        const latestToken = activations[activations.length - 1];
        if (latestToken) {
          Array.from(latestToken.facts.values()).forEach(fact => {
          let factDetails = fact.type;
          
          if (fact.type === 'StakeOf') {
            factDetails += ` of ${(fact as StakeOfFact).account}: ${(fact as StakeOfFact).amount}`;
          } else if (fact.type === 'PermissionExists') {
            factDetails += ` for ${(fact as PermissionExistsFact).permId}: ${(fact as PermissionExistsFact).exists}`;
          } else if (fact.type === 'PermissionEnabled') {
            factDetails += ` for ${(fact as PermissionEnabledFact).permId}: ${(fact as PermissionEnabledFact).enabled}`;
          } else if (fact.type === 'InactiveUnlessRedelegated') {
            const iur = fact as InactiveUnlessRedelegatedFact;
            factDetails += ` for ${iur.account}: ${iur.percentage}% (redelegated: ${iur.isRedelegated})`;
          }
          
          visualization += `      ${factDetails}\n`;
        });
        }
      }
    }
    
    // Working memory summary
    visualization += "\nWORKING MEMORY SUMMARY:\n";
    visualization += `  Account facts: ${Array.from(this.workingMemory.accountFacts.keys()).length} accounts\n`;
    visualization += `  Permission facts: ${Array.from(this.workingMemory.permissionFacts.keys()).length} permissions\n`;
    
    return visualization;
  }

  /**
   * Get structured network components for debugging and inspection
   * @returns Structured data about all network components
   */
  getNetworkComponents(): {
    alphaNodes: {
      key: string;
      factCount: number;
      facts: {
        type: string;
        details: any;
      }[];
      successorCount: number;
    }[];
    betaNodes: {
      index: number;
      tokenCount: number;
      uniqueCombinations: number;
      allTokens: {
        tokenIndex: number;
        facts: {
          key: string;
          type: string;
          details: any;
        }[];
        factCount: number;
        summary: string;
      }[];
      successorCount: number;
    }[];
    productionNodes: {
      id: string;
      constraintId: string;
      activationCount: number;
      uniqueActivations: number;
      status: 'satisfied' | 'violated' | 'unknown';
      constraint: {
        permId: string;
        bodyType: string;
        bodyStructure: any;
      };
      allActivations: {
        activationIndex: number;
        facts: {
          type: string;
          details: any;
        }[];
        factCount: number;
        summary: string;
      }[];
    }[];
    workingMemory: {
      totalFacts: number;
      accountFacts: Record<string, {
        type: string;
        details: any;
      }[]>;
      permissionFacts: Record<string, {
        type: string;
        details: any;
      }[]>;
      currentBlock?: {
        number: string;
        timestamp: string;
      };
    };
  } {
    // Update all constraint states before returning network components
    this.updateAllConstraintStates();
    
    // Alpha nodes
    const alphaNodes = Array.from(this.alphaNodes.entries()).map(([key, node]) => ({
      key,
      factCount: node.memory.facts.length,
      facts: node.memory.facts.map(fact => ({
        type: fact.type,
        details: this.sanitizeFactForSerialization(fact)
      })),
      successorCount: node.memory.successors.size
    }));

    // Beta nodes
    const betaNodes = this.betaNodes.map((node, index) => {
      const uniqueCombinations = new Set<string>();
      const allTokens = node.memory.tokens.map((token, tokenIndex) => {
        const facts = Array.from(token.facts.entries()).map(([key, fact]) => ({
          key,
          type: fact.type,
          details: this.sanitizeFactForSerialization(fact)
        }));
        
        const factSummary = facts
          .map(f => `${f.type}:${superjson.stringify(f.details)}`)
          .sort()
          .join('|');
        uniqueCombinations.add(factSummary);

        return {
          tokenIndex: tokenIndex + 1,
          facts,
          factCount: facts.length,
          summary: factSummary
        };
      });

      return {
        index: index + 1,
        tokenCount: node.memory.tokens.length,
        uniqueCombinations: uniqueCombinations.size,
        allTokens,
        successorCount: node.memory.successors.size
      };
    });

    // Production nodes
    const productionNodes = Array.from(this.productionNodes.entries()).map(([id, node]) => {
      const activations = node.getActivations();
      const uniqueActivations = new Set<string>();
      
      const allActivations = activations.map((token, activationIndex) => {
        const facts = Array.from(token.facts.values()).map(fact => ({
          type: fact.type,
          details: this.sanitizeFactForSerialization(fact)
        }));
        
        const factSummary = facts
          .map(f => `${f.type}:${superjson.stringify(f.details)}`)
          .sort()
          .join('|');
        uniqueActivations.add(factSummary);

        return {
          activationIndex: activationIndex + 1,
          facts,
          factCount: facts.length,
          summary: factSummary
        };
      });

      return {
        id,
        constraintId: node.constraint.permId,
        activationCount: activations.length,
        uniqueActivations: uniqueActivations.size,
        status: this.getConstraintEvaluationStatus(id),
        constraint: {
          permId: node.constraint.permId,
          bodyType: typeof node.constraint.body,
          bodyStructure: this.getBoolExprStructure(node.constraint.body)
        },
        allActivations
      };
    });

    // Working memory
    const allFacts = this.workingMemory.getAllFacts();
    const accountFacts: Record<string, any[]> = {};
    const permissionFacts: Record<string, any[]> = {};
    let currentBlock: any = undefined;

    allFacts.forEach(fact => {
      const sanitized = {
        type: fact.type,
        details: this.sanitizeFactForSerialization(fact)
      };

      if (fact.type === 'StakeOf' || fact.type === 'InactiveUnlessRedelegated') {
        const accountId = (fact as StakeOfFact | InactiveUnlessRedelegatedFact).account;
        if (!accountFacts[accountId]) accountFacts[accountId] = [];
        accountFacts[accountId].push(sanitized);
      } else if (fact.type === 'PermissionExists' || fact.type === 'PermissionEnabled') {
        const permId = (fact as PermissionExistsFact | PermissionEnabledFact).permId;
        if (!permissionFacts[permId]) permissionFacts[permId] = [];
        permissionFacts[permId].push(sanitized);
      } else if (fact.type === 'Block') {
        const blockFact = fact as BlockFact;
        currentBlock = {
          number: blockFact.number.toString(),
          timestamp: blockFact.timestamp.toString()
        };
      }
    });

    return {
      alphaNodes,
      betaNodes,
      productionNodes,
      workingMemory: {
        totalFacts: allFacts.length,
        accountFacts,
        permissionFacts,
        currentBlock
      }
    };
  }

  /**
   * Gets a readable structure representation of a boolean expression
   */
  // TODO: ZOD ZOD ZOD ZOD ZOD ZOD ZOD ZOD MATCH MATCH MATCH
  private getBoolExprStructure(expr: BoolExprType): any {
    switch (expr.$) {
      case 'Not':
        return {
          type: 'NOT',
          body: this.getBoolExprStructure(expr.body)
        };
      case 'And':
        return {
          type: 'AND',
          left: this.getBoolExprStructure(expr.left),
          right: this.getBoolExprStructure(expr.right)
        };
      case 'Or':
        return {
          type: 'OR',
          left: this.getBoolExprStructure(expr.left),
          right: this.getBoolExprStructure(expr.right)
        };
      case 'CompExpr':
        return {
          type: 'COMPARISON',
          operator: expr.op,
          left: this.getNumExprStructure(expr.left),
          right: this.getNumExprStructure(expr.right)
        };
      case 'Base':
        return {
          type: 'BASE_CONSTRAINT',
          constraint: expr.body
        };
      default:
        return { type: 'UNKNOWN', expr };
    }
  }

  /**
   * Gets a readable structure representation of a numeric expression
   */
  private getNumExprStructure(expr: NumExprType): any {
    switch (expr.$) {
      case 'UIntLiteral':
        return { type: 'LITERAL', value: expr.value };
      case 'BlockNumber':
        return { type: 'BLOCK_NUMBER' };
      case 'StakeOf':
        return { type: 'STAKE_OF', account: expr.account };
      case 'Add':
        return {
          type: 'ADD',
          left: this.getNumExprStructure(expr.left),
          right: this.getNumExprStructure(expr.right)
        };
      case 'Sub':
        return {
          type: 'SUBTRACT',
          left: this.getNumExprStructure(expr.left),
          right: this.getNumExprStructure(expr.right)
        };
      default:
        return { type: 'UNKNOWN', expr };
    }
  }

  /**
   * Sanitizes a fact for JSON serialization using superjson (handles BigInt automatically)
   */
  private sanitizeFactForSerialization(fact: Fact): any {
    // Use superjson to serialize and deserialize to get a JSON-safe object
    const serialized = superjson.stringify(fact);
    return superjson.parse(serialized);
  }
}