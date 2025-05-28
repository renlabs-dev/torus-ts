import type {
  AccountId,
  PermId,
  NumExprType,
  Constraint,
  CompOp,
  UInt,
  BoolExprType,
  BaseConstraintType
} from './types';
import type {
  Fact,
  SpecificFact,
  ComparisonFact,
  StakeOfFact,
  WeightSetFact,
  WeightPowerFromFact,
  PermissionExistsFact,
  PermissionEnabledFact,
  MaxDelegationDepthFact,
  InactiveUnlessRedelegatedFact,
  BlockFact} from './facts';
import {
  extractFactsFromConstraint,
  categorizeFacts,
  deduplicateFacts
} from './facts';

/**
 * Generate a hash string for a fact or token, handling BigInt values
 * @param obj The object to hash
 * @returns A string hash
 */
function hashObject(obj: any): string {
  return JSON.stringify(obj, (_, value) => {
    // Handle BigInt serialization
    if (typeof value === 'bigint') {
      return `BigInt:${value.toString()}`;
    }
    return value;
  });
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
        const existingKeys = this.entityToKeyMap.get(entityId)!;
        
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
      if (!this.entityToKeyMap.has(entityId)) {
        this.entityToKeyMap.set(entityId, new Set());
      }
      
      this.entityToKeyMap.get(entityId)!.add(factKey);
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
      return `account:${(fact as any).account}`;
    }
    
    if (fact.type === 'WeightSet' || fact.type === 'WeightPowerFrom') {
      return `weight:${(fact as any).from}:${(fact as any).to}`;
    }
    
    if (
      fact.type === 'PermissionExists' || 
      fact.type === 'PermissionEnabled' || 
      fact.type === 'MaxDelegationDepth' || 
      fact.type === 'InactiveUnlessRedelegated'
    ) {
      if ('permId' in fact) {
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
export class AccountAlphaNode extends AlphaNode<StakeOfFact | WeightSetFact | WeightPowerFromFact> {
  private readonly accountId: AccountId;
  private readonly factSubtype?: string;
  private readonly role?: 'from' | 'to' | 'any';

  /**
   * Create an account alpha node
   * @param accountId The account ID to match
   * @param factSubtype Optional fact subtype (StakeOf, WeightSet, WeightPowerFrom)
   * @param role Optional role (from, to, or any) for weight-related facts
   */
  constructor(accountId: AccountId, factSubtype?: string, role: 'from' | 'to' | 'any' = 'any') {
    super();
    this.accountId = accountId;
    this.factSubtype = factSubtype;
    this.role = role;
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
    
    if (fact.type === 'WeightSet' || fact.type === 'WeightPowerFrom') {
      // If subtype is specified, only match that specific subtype
      if (this.factSubtype && this.factSubtype !== fact.type) {
        return false;
      }
      
      const weightFact = fact as WeightSetFact | WeightPowerFromFact;
      
      // Check role if specified
      if (this.role === 'from') {
        return weightFact.from === this.accountId;
      } else if (this.role === 'to') {
        return weightFact.to === this.accountId;
      } else {
        // Match either from or to fields
        return weightFact.from === this.accountId || weightFact.to === this.accountId;
      }
    }
    
    return false;
  }
  
  /**
   * Get a key for this node
   * @returns A unique key for this node
   */
  getKey(): AlphaNodeKey {
    return `Account:${this.accountId}:${this.factSubtype || 'Any'}:${this.role}`;
  }
}

/**
 * Alpha node for permission-related facts
 */
export class PermissionAlphaNode extends AlphaNode<
  PermissionExistsFact | PermissionEnabledFact | MaxDelegationDepthFact | InactiveUnlessRedelegatedFact
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
      fact.type === 'PermissionEnabled' || 
      fact.type === 'MaxDelegationDepth' || 
      fact.type === 'InactiveUnlessRedelegated'
    ) {
      // If subtype is specified, only match that specific subtype
      if (this.factSubtype && this.factSubtype !== fact.type) {
        return false;
      }
      
      if (fact.type === 'PermissionExists') {
        return (fact as PermissionExistsFact).permId === this.permId;
      } else if (fact.type === 'PermissionEnabled') {
        return (fact as PermissionEnabledFact).permId === this.permId;
      } else if (fact.type === 'MaxDelegationDepth') {
        return (fact as MaxDelegationDepthFact).permId === this.permId;
      } else if (fact.type === 'InactiveUnlessRedelegated') {
        return (fact as InactiveUnlessRedelegatedFact).permId === this.permId;
      }
    }
    
    return false;
  }
  
  /**
   * Get a key for this node
   * @returns A unique key for this node
   */
  getKey(): AlphaNodeKey {
    return `Permission:${this.permId}:${this.factSubtype || 'Any'}`;
  }
}

/**
 * Block fact for tracking current block information
 */

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
    
    // Allow joining different fact types for the same constraint
    // This helps with constraints that combine different types (like StakeOf and PermissionExists)
    const getEntityId = (f: Fact): string => {
      if (f.type === 'StakeOf') return (f as StakeOfFact).account;
      if (f.type === 'WeightSet' || f.type === 'WeightPowerFrom') {
        const wf = f as (WeightSetFact | WeightPowerFromFact);
        return `${wf.from}:${wf.to}`;
      }
      if (f.type === 'PermissionExists' || f.type === 'PermissionEnabled' || 
          f.type === 'MaxDelegationDepth' || f.type === 'InactiveUnlessRedelegated') {
        return 'permId' in f ? (f as any).permId : '';
      }
      return '';
    };
    
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
    // Apply all comparison tests
    for (const test of this.comparisonTests) {
      if (!test.evaluate(token.facts)) {
        return; // Test failed, don't activate
      }
    }
    
    // Create a consistent key for the token
    const tokenKey = hashToken(token);
    
    // Add to activations if not already present
    if (!this.activations.has(tokenKey)) {
      this.activations.set(tokenKey, token);
    }
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
function createComparisonTest(comparison: ComparisonFact): ComparisonTest {
  return {
    op: comparison.op,
    left: comparison.left,
    right: comparison.right,
    evaluate: (facts: Map<string, Fact>): boolean => {
      // TODO: Implement proper evaluation of numeric expressions
      // This would require evaluating the left and right expressions
      // based on the actual facts available at runtime
      
      // For now, we return true to indicate the comparison passes
      // In a real implementation, this would calculate actual values
      return true;
    }
  };
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
    } else if (fact.type === 'WeightSet' || fact.type === 'WeightPowerFrom') {
      return this.addOrUpdateWeightFact(fact as (WeightSetFact | WeightPowerFromFact));
    } else if (
      fact.type === 'PermissionExists' || 
      fact.type === 'PermissionEnabled' || 
      fact.type === 'MaxDelegationDepth' || 
      fact.type === 'InactiveUnlessRedelegated'
    ) {
      return this.addOrUpdatePermissionFact(fact as (PermissionExistsFact | PermissionEnabledFact | MaxDelegationDepthFact | InactiveUnlessRedelegatedFact));
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
      this.accountFacts.set(account, new Map());
      
      // New account, just add the fact
      const accountMap = this.accountFacts.get(account)!;
      const factKey = hashObject(fact);
      accountMap.set(factKey, fact);
      
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
   * Add or update a weight fact
   * @param fact The weight fact to add or update
   * @returns Result object with isNew, updated flags and the final fact
   */
  private addOrUpdateWeightFact(fact: WeightSetFact | WeightPowerFromFact): 
    { isNew: boolean, updated: boolean, fact: WeightSetFact | WeightPowerFromFact } {
    const { from, to } = fact;
    
    // Check if we have existing weight facts for this from/to pair
    let existingFact: WeightSetFact | WeightPowerFromFact | undefined;
    let existingKey: string | undefined;
    let sourceMap: Map<string, Fact> | undefined;
    
    // Check in 'from' account map
    if (this.accountFacts.has(from)) {
      const fromMap = this.accountFacts.get(from)!;
      
      for (const [key, f] of fromMap.entries()) {
        if (f.type === fact.type && 
            (f as any).from === from && 
            (f as any).to === to) {
          existingFact = f as (WeightSetFact | WeightPowerFromFact);
          existingKey = key;
          sourceMap = fromMap;
          break;
        }
      }
    }
    
    // If not found in 'from', check in 'to' account map
    if (!existingFact && this.accountFacts.has(to)) {
      const toMap = this.accountFacts.get(to)!;
      
      for (const [key, f] of toMap.entries()) {
        if (f.type === fact.type && 
            (f as any).from === from && 
            (f as any).to === to) {
          existingFact = f as (WeightSetFact | WeightPowerFromFact);
          existingKey = key;
          sourceMap = toMap;
          break;
        }
      }
    }
    
    // If we found an existing fact, update it
    if (existingFact && existingKey && sourceMap) {
      // Check if amount actually changed
      if (existingFact.amount === fact.amount) {
        return { isNew: false, updated: false, fact: existingFact };
      }
      
      // Update the amount
      existingFact.amount = fact.amount;
      
      // Remove old key and add with new key (since the hash may have changed)
      sourceMap.delete(existingKey);
      const newKey = hashObject(existingFact);
      sourceMap.set(newKey, existingFact);
      
      // Also update in the other account map if it exists
      if (sourceMap === this.accountFacts.get(from) && this.accountFacts.has(to)) {
        const toMap = this.accountFacts.get(to)!;
        
        // Look for the fact in the to map
        for (const [key, f] of toMap.entries()) {
          if (f.type === fact.type && 
              (f as any).from === from && 
              (f as any).to === to) {
            toMap.delete(key);
            break;
          }
        }
        
        // Add updated fact to to map
        toMap.set(newKey, existingFact);
      } else if (sourceMap === this.accountFacts.get(to) && this.accountFacts.has(from)) {
        const fromMap = this.accountFacts.get(from)!;
        
        // Look for the fact in the from map
        for (const [key, f] of fromMap.entries()) {
          if (f.type === fact.type && 
              (f as any).from === from && 
              (f as any).to === to) {
            fromMap.delete(key);
            break;
          }
        }
        
        // Add updated fact to from map
        fromMap.set(newKey, existingFact);
      }
      
      return { isNew: false, updated: true, fact: existingFact };
    }
    
    // No existing fact found, add a new one
    
    // For the 'from' account
    if (!this.accountFacts.has(from)) {
      this.accountFacts.set(from, new Map());
    }
    
    const fromMap = this.accountFacts.get(from)!;
    const factKey = hashObject(fact);
    
    fromMap.set(factKey, fact);
    
    // For the 'to' account
    if (!this.accountFacts.has(to)) {
      this.accountFacts.set(to, new Map());
    }
    
    const toMap = this.accountFacts.get(to)!;
    toMap.set(factKey, fact);
    
    return { isNew: true, updated: false, fact };
  }
  
  /**
   * Add a weight fact (legacy method)
   * @param fact The weight fact to add
   * @returns true if the fact was new, false otherwise
   */
  private addWeightFact(fact: WeightSetFact | WeightPowerFromFact): boolean {
    return this.addOrUpdateWeightFact(fact).isNew;
  }
  
  /**
   * Add or update a permission fact
   * @param fact The permission fact to add or update
   * @returns Result object with isNew, updated flags and the final fact
   */
  private addOrUpdatePermissionFact(
    fact: PermissionExistsFact | PermissionEnabledFact | MaxDelegationDepthFact | InactiveUnlessRedelegatedFact
  ): { 
    isNew: boolean, 
    updated: boolean, 
    fact: PermissionExistsFact | PermissionEnabledFact | MaxDelegationDepthFact | InactiveUnlessRedelegatedFact 
  } {
    const permId = 'permId' in fact ? fact.permId : '';
    
    if (!permId) {
      return { isNew: false, updated: false, fact }; // Invalid permission fact
    }
    
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
        } else if (fact.type === 'PermissionEnabled') {
          const existingPermFact = existingFact as PermissionEnabledFact;
          const newPermFact = fact;
          
          if (existingPermFact.enabled !== newPermFact.enabled) {
            existingPermFact.enabled = newPermFact.enabled;
            hasChanged = true;
          }
        } else if (fact.type === 'MaxDelegationDepth') {
          const existingPermFact = existingFact as MaxDelegationDepthFact;
          const newPermFact = fact;
          
          // For MaxDelegationDepth, we need to check if the depth or actualDepth changed
          if (JSON.stringify(existingPermFact.depth) !== JSON.stringify(newPermFact.depth) ||
              existingPermFact.actualDepth !== newPermFact.actualDepth) {
            existingPermFact.depth = newPermFact.depth;
            existingPermFact.actualDepth = newPermFact.actualDepth;
            hasChanged = true;
          }
        } else if (fact.type === 'InactiveUnlessRedelegated') {
          const existingPermFact = existingFact as InactiveUnlessRedelegatedFact;
          const newPermFact = fact;
          
          if (existingPermFact.isRedelegated !== newPermFact.isRedelegated) {
            existingPermFact.isRedelegated = newPermFact.isRedelegated;
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
          fact: existingFact as 
            PermissionExistsFact | PermissionEnabledFact | 
            MaxDelegationDepthFact | InactiveUnlessRedelegatedFact 
        };
      }
    }
    
    // No existing fact of this type found, add a new one
    const factKey = hashObject(fact);
    permMap.set(factKey, fact);
    
    return { isNew: true, updated: false, fact };
  }
  
  /**
   * Add a permission fact (legacy method)
   * @param fact The permission fact to add
   * @returns true if the fact was new, false otherwise
   */
  private addPermissionFact(
    fact: PermissionExistsFact | PermissionEnabledFact | MaxDelegationDepthFact | InactiveUnlessRedelegatedFact
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
   * Set the current block information (legacy method)
   * @param blockFact The block fact
   * @returns true if the block info was updated, false otherwise
   */
  private setCurrentBlock(blockFact: BlockFact): boolean {
    return true; // Always returns true for compatibility
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
  
  /**
   * Add a constraint to the Rete network
   * @param constraint The constraint to add
   * @returns The ID of the production node
   */
  addConstraint(constraint: Constraint): string {
    // Extract facts and comparisons from the constraint
    const allFacts = extractFactsFromConstraint(constraint);
    
    // Separate facts and comparisons
    const facts = allFacts.filter(f => f.type !== 'Comparison');
    const comparisons = allFacts.filter(f => f.type === 'Comparison');
    
    // Create comparison tests for the production node
    const comparisonTests = comparisons.map(createComparisonTest);
    
    // Get or create alpha nodes for each fact type
    const alphaNodes: AlphaNode<Fact>[] = [];
    
    // Process each fact to create appropriate alpha nodes
    for (const fact of facts) {
      let alphaNode: AlphaNode<Fact> | undefined;
      
      if (fact.type === 'StakeOf') {
        // StakeOf fact - index by account
        const key = `Account:${fact.account}:StakeOf`;
        alphaNode = this.alphaNodes.get(key)!;
        
        if (!alphaNode) {
          alphaNode = new AccountAlphaNode(fact.account, 'StakeOf');
          this.alphaNodes.set(key, alphaNode);
        }
      } else if (fact.type === 'WeightSet' || fact.type === 'WeightPowerFrom') {
        // Weight fact - index by from and to accounts
        
        // From account node
        const keyFrom = `Account:${fact.from}:${fact.type}:from`;
        let alphaNodeFrom = this.alphaNodes.get(keyFrom)!;
        
        if (!alphaNodeFrom) {
          alphaNodeFrom = new AccountAlphaNode(fact.from, fact.type, 'from');
          this.alphaNodes.set(keyFrom, alphaNodeFrom);
        }
        
        // To account node
        const keyTo = `Account:${fact.to}:${fact.type}:to`;
        let alphaNodeTo = this.alphaNodes.get(keyTo)!;
        
        if (!alphaNodeTo) {
          alphaNodeTo = new AccountAlphaNode(fact.to, fact.type, 'to');
          this.alphaNodes.set(keyTo, alphaNodeTo);
        }
        
        alphaNodes.push(alphaNodeFrom);
        alphaNodes.push(alphaNodeTo);
        continue; // Skip adding again below
      } else if (
        fact.type === 'PermissionExists' || 
        fact.type === 'PermissionEnabled' || 
        fact.type === 'MaxDelegationDepth' || 
        fact.type === 'InactiveUnlessRedelegated'
      ) {
        // Permission fact - index by permId
        const permId = 'permId' in fact ? fact.permId : '';
        
        if (!permId) {
          continue; // Skip invalid permission facts
        }
        
        const key = `Permission:${permId}:${fact.type}`;
        alphaNode = this.alphaNodes.get(key)!;
        
        if (!alphaNode) {
          alphaNode = new PermissionAlphaNode(permId, fact.type);
          this.alphaNodes.set(key, alphaNode);
        }
      } else if (fact.type === 'Block') {
        // Block fact - one global node
        const key = 'Block';
        alphaNode = this.alphaNodes.get(key)!;
        
        if (!alphaNode) {
          alphaNode = new BlockAlphaNode();
          this.alphaNodes.set(key, alphaNode);
        }
      } else {
        // Unknown fact type, skip
        continue;
      }
      
      if (alphaNode) {
        alphaNodes.push(alphaNode);
      }
    }
    
    // If we have multiple facts, create a simple linear beta network
    let productionNode: ProductionNode;
    
    if (alphaNodes.length === 0) {
      // No facts, just create a production node with the comparisons
      productionNode = new ProductionNode(constraint, comparisonTests);
    } else if (alphaNodes.length === 1) {
      // Single fact case - create a production node directly connected to the alpha node
      productionNode = new ProductionNode(constraint, comparisonTests);
      
      // Create a simple adapter to connect alpha to production
      const dummyMemory = new BetaMemory();
      const firstAlphaNode = alphaNodes[0];
      if (!firstAlphaNode) {
        throw new Error('No alpha nodes found for constraint');
      }
      const singleFactBeta = new BetaNode(dummyMemory, firstAlphaNode.memory);
      this.betaNodes.push(singleFactBeta);
      
      // Add initial empty token to start
      dummyMemory.addToken({ facts: new Map() });
      
      // Connect the beta node to the production node
      singleFactBeta.memory.successors.add(productionNode);
      
      // Process existing facts in this alpha node
      for (const fact of alphaNodes[0]?.memory.facts || []) {
        singleFactBeta.rightActivation(fact);
      }
    } else {
      // Multiple facts - build a beta network
      
      // Create the first beta node with a dummy left input
      const dummyMemory = new BetaMemory();
      dummyMemory.addToken({ facts: new Map() });
      
      let previousNode = new BetaNode(dummyMemory, alphaNodes[0]!.memory);
      this.betaNodes.push(previousNode);
      
      // Process existing facts in the first alpha node
      for (const fact of alphaNodes[0]?.memory.facts || []) {
        previousNode.rightActivation(fact);
      }
      
      // Chain the rest of the alpha nodes through beta nodes
      for (let i = 1; i < alphaNodes.length; i++) {
        const currentNode = new BetaNode(previousNode.memory, alphaNodes[i]!.memory);
        this.betaNodes.push(currentNode);
        
        // Process existing facts in this alpha node
        for (const fact of alphaNodes[i]?.memory.facts || []) {
          currentNode.rightActivation(fact);
        }
        
        previousNode = currentNode;
      }
      
      // Create the production node and connect it to the final beta node
      productionNode = new ProductionNode(constraint, comparisonTests);
      previousNode.memory.successors.add(productionNode);
      
      // Activate production node with any existing tokens
      for (const token of previousNode.memory.tokens) {
        productionNode.activate(token);
      }
    }
    
    // Register the production node
    const productionId = `prod_${constraint.permId}_${Date.now()}`;
    this.productionNodes.set(productionId, productionNode);
    
    return productionId;
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
  addFact(fact: Fact): { isNew: boolean, updated: boolean } {
    // Add or update the fact in working memory
    const result = this.workingMemory.addOrUpdateFact(fact);
    
    // Process the fact through the network if it's new or updated
    if (result.isNew || result.updated) {
      // Process the fact through the network
      this.processFact(result.fact, result.updated);
    }
    
    return { isNew: result.isNew, updated: result.updated };
  }
  
  /**
   * Check if a fact is an update to an existing fact
   * @param fact The fact to check
   * @returns true if this would update an existing fact
   */
  private isUpdateToExistingFact(fact: Fact): boolean {
    // For account-based facts
    if (fact.type === 'StakeOf') {
      const accountFacts = this.workingMemory.getAccountFacts((fact as StakeOfFact).account);
      return accountFacts.some(f => f.type === 'StakeOf');
    }
    
    // For weight-based facts
    if (fact.type === 'WeightSet' || fact.type === 'WeightPowerFrom') {
      const weightFact = fact as (WeightSetFact | WeightPowerFromFact);
      const fromFacts = this.workingMemory.getAccountFacts(weightFact.from);
      const toFacts = this.workingMemory.getAccountFacts(weightFact.to);
      
      // Check if we already have a weight fact for this from/to pair
      return fromFacts.some(f => 
        (f.type === fact.type) && 
        (f as any).from === weightFact.from && 
        (f as any).to === weightFact.to
      ) || toFacts.some(f => 
        (f.type === fact.type) && 
        (f as any).from === weightFact.from && 
        (f as any).to === weightFact.to
      );
    }
    
    // For permission-based facts
    if (
      fact.type === 'PermissionExists' || 
      fact.type === 'PermissionEnabled' || 
      fact.type === 'MaxDelegationDepth' || 
      fact.type === 'InactiveUnlessRedelegated'
    ) {
      const permId = 'permId' in fact ? (fact as any).permId : '';
      if (!permId) return false;
      
      const permFacts = this.workingMemory.getPermissionFacts(permId);
      return permFacts.some(f => f.type === fact.type);
    }
    
    return false;
  }
  
  /**
   * Remove a fact from the network
   * @param fact The fact to remove
   * @returns true if the fact was removed, false otherwise
   */
  removeFact(fact: Fact): boolean {
    // We only need to implement the core logic for fact removal
    // For a complete implementation, we would need to:
    // 1. Remove the fact from working memory
    // 2. Remove the fact from alpha memories
    // 3. Remove tokens containing this fact from beta memories
    // 4. Update production node activations
    
    // For now, we'll just remove from working memory
    // TODO: Implement removeFact method in WorkingMemory class
    return false;
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
  addFacts(facts: Fact[]): { isNew: boolean, updated: boolean }[] {
    const results: { isNew: boolean, updated: boolean }[] = [];
    
    for (const fact of facts) {
      results.push(this.addFact(fact));
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
            } else if (fact.type === 'WeightSet' || fact.type === 'WeightPowerFrom') {
              const wf = fact as (WeightSetFact | WeightPowerFromFact);
              return `${fact.type}:${wf.from}:${wf.to}:${wf.amount}`;
            } else if (
              fact.type === 'PermissionExists' || 
              fact.type === 'PermissionEnabled' || 
              fact.type === 'MaxDelegationDepth' || 
              fact.type === 'InactiveUnlessRedelegated'
            ) {
              if ('permId' in fact) {
                return `${fact.type}:${(fact as any).permId}`;
              }
              return fact.type;
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
            } else if (fact.type === 'WeightSet' || fact.type === 'WeightPowerFrom') {
              const wf = fact as (WeightSetFact | WeightPowerFromFact);
              return `${fact.type}:${wf.from}:${wf.to}:${wf.amount}`;
            } else if (
              fact.type === 'PermissionExists' || 
              fact.type === 'PermissionEnabled' || 
              fact.type === 'MaxDelegationDepth' || 
              fact.type === 'InactiveUnlessRedelegated'
            ) {
              if ('permId' in fact) {
                return `${fact.type}:${(fact as any).permId}`;
              }
              return fact.type;
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
          } else if (fact.type === 'WeightSet') {
            const wf = fact as WeightSetFact;
            factDetails += ` from ${wf.from} to ${wf.to}: ${wf.amount}`;
          } else if (fact.type === 'PermissionExists') {
            factDetails += ` for ${(fact as PermissionExistsFact).permId}: ${(fact as PermissionExistsFact).exists}`;
          } else if (fact.type === 'PermissionEnabled') {
            factDetails += ` for ${(fact as PermissionEnabledFact).permId}: ${(fact as PermissionEnabledFact).enabled}`;
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
}