import {
  Constraint,
  BoolExpr,
  BaseConstraint,
  NumExpr,
  CompOp
} from './types';
import {
  extractFactsFromConstraint,
  categorizeFacts,
  deduplicateFacts,
  StakeOfFact,
  WeightSetFact,
  PermissionExistsFact
} from './facts';

describe('Facts extraction', () => {
  test('should extract StakeOf facts from constraint', () => {
    // Create a constraint with StakeOf expression
    const constraint: Constraint = {
      permId: "permission1",
      body: {
        $: "CompExpr",
        op: CompOp.Gt,
        left: { $: "StakeOf", account: "account1" },
        right: { $: "UIntLiteral", value: BigInt(100) }
      }
    };
    
    const facts = extractFactsFromConstraint(constraint);
    
    // Verify we extracted the StakeOf fact
    expect(facts).toContainEqual({
      type: 'StakeOf',
      account: 'account1'
    });
    
    // Also verify the comparison fact was extracted
    expect(facts.some(f => f.type === 'Comparison')).toBe(true);
  });
  
  test('should extract WeightSet facts from constraint', () => {
    // Create a constraint with WeightSet expression
    const constraint: Constraint = {
      permId: "permission1",
      body: {
        $: "CompExpr",
        op: CompOp.Gt,
        left: { $: "WeightSet", from: "account1", to: "account2" },
        right: { $: "UIntLiteral", value: BigInt(0) }
      }
    };
    
    const facts = extractFactsFromConstraint(constraint);
    
    // Verify we extracted the WeightSet fact
    expect(facts).toContainEqual({
      type: 'WeightSet',
      from: 'account1',
      to: 'account2'
    });
  });
  
  test('should extract permission facts from constraint', () => {
    // Create a constraint with permission constraints
    const constraint: Constraint = {
      permId: "permission1",
      body: {
        $: "And",
        left: { 
          $: "Base", 
          body: { $: "PermissionExists", pid: "permission2" } 
        },
        right: { 
          $: "Base", 
          body: { $: "PermissionEnabled", pid: "permission2" } 
        }
      }
    };
    
    const facts = extractFactsFromConstraint(constraint);
    
    // Verify we extracted both permission facts
    expect(facts).toContainEqual({
      type: 'PermissionExists',
      permId: 'permission2'
    });
    
    expect(facts).toContainEqual({
      type: 'PermissionEnabled',
      permId: 'permission2'
    });
  });
  
  test('should extract MaxDelegationDepth facts from constraint', () => {
    // Create a constraint with MaxDelegationDepth constraint
    const constraint: Constraint = {
      permId: "permission1",
      body: {
        $: "Base",
        body: { 
          $: "MaxDelegationDepth", 
          depth: { $: "UIntLiteral", value: BigInt(3) } 
        }
      }
    };
    
    const facts = extractFactsFromConstraint(constraint);
    
    // Verify we extracted the MaxDelegationDepth fact
    expect(facts.some(f => 
      f.type === 'MaxDelegationDepth' && 
      (f as any).permId === 'permission1' &&
      (f as any).depth.$  === 'UIntLiteral'
    )).toBe(true);
  });
  
  test('should extract facts from complex nested expressions', () => {
    // Create a complex constraint with nested expressions
    const constraint: Constraint = {
      permId: "permission1",
      body: {
        $: "And",
        left: {
          $: "Or",
          left: {
            $: "CompExpr",
            op: CompOp.Gt,
            left: { $: "StakeOf", account: "account1" },
            right: { $: "UIntLiteral", value: BigInt(100) }
          },
          right: {
            $: "Base",
            body: { $: "PermissionExists", pid: "permission2" }
          }
        },
        right: {
          $: "CompExpr",
          op: CompOp.Gt,
          left: { $: "WeightSet", from: "account1", to: "account2" },
          right: { $: "UIntLiteral", value: BigInt(0) }
        }
      }
    };
    
    const facts = extractFactsFromConstraint(constraint);
    
    // Verify we extracted all facts
    expect(facts).toContainEqual({
      type: 'StakeOf',
      account: 'account1'
    });
    
    expect(facts).toContainEqual({
      type: 'PermissionExists',
      permId: 'permission2'
    });
    
    expect(facts).toContainEqual({
      type: 'WeightSet',
      from: 'account1',
      to: 'account2'
    });
    
    // Also verify we have the right number of comparison facts
    expect(facts.filter(f => f.type === 'Comparison').length).toBe(2);
  });
  
  test('should categorize facts correctly', () => {
    const constraint: Constraint = {
      permId: "permission1",
      body: {
        $: "And",
        left: {
          $: "CompExpr",
          op: CompOp.Gt,
          left: { $: "StakeOf", account: "account1" },
          right: { $: "UIntLiteral", value: BigInt(100) }
        },
        right: {
          $: "Base",
          body: { $: "PermissionExists", pid: "permission2" }
        }
      }
    };
    
    const facts = extractFactsFromConstraint(constraint);
    const categorized = categorizeFacts(facts);
    
    // Check address facts
    expect(categorized.addressFacts.length).toBe(1);
    expect(categorized.addressFacts[0].type).toBe('StakeOf');
    
    // Check permission facts
    expect(categorized.permissionFacts.length).toBe(1);
    expect(categorized.permissionFacts[0].type).toBe('PermissionExists');
    
    // Check comparison facts
    expect(categorized.comparisonFacts.length).toBe(1);
  });
  
  test('should deduplicate identical facts', () => {
    // Create an array with duplicate facts
    const facts = [
      { type: 'StakeOf', account: 'account1' } as StakeOfFact,
      { type: 'StakeOf', account: 'account1' } as StakeOfFact,
      { type: 'WeightSet', from: 'account1', to: 'account2' } as WeightSetFact,
      { type: 'PermissionExists', permId: 'permission1' } as PermissionExistsFact,
      { type: 'PermissionExists', permId: 'permission1' } as PermissionExistsFact
    ];
    
    const uniqueFacts = deduplicateFacts(facts);
    
    // Verify duplicates were removed
    expect(uniqueFacts.length).toBe(3);
    expect(uniqueFacts.filter(f => f.type === 'StakeOf').length).toBe(1);
    expect(uniqueFacts.filter(f => f.type === 'WeightSet').length).toBe(1);
    expect(uniqueFacts.filter(f => f.type === 'PermissionExists').length).toBe(1);
  });
});