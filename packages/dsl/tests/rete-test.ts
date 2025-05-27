import {
  Constraint,
  BoolExpr,
  BaseConstraint,
  NumExpr,
  CompOp,
  extractFactsFromConstraint,
  ReteNetwork,
  AlphaMemory,
  WorkingMemory,
  StakeOfFact,
  WeightSetFact,
  PermissionExistsFact,
  PermissionEnabledFact
} from '../src/index';

// Helper function to create a complex constraint for testing
function createComplexConstraint(): Constraint {
  return {
    permId: "complex_permission",
    body: {
      $: "And",
      left: {
        $: "Base",
        body: {
          $: "PermissionEnabled",
          pid: "admin_access"
        }
      },
      right: {
        $: "CompExpr",
        op: CompOp.Gt,
        left: {
          $: "StakeOf",
          account: "user123"
        },
        right: {
          $: "UIntLiteral",
          value: BigInt(5000000)
        }
      }
    }
  };
}

// Helper function to create a constraint with weight facts
function createWeightConstraint(): Constraint {
  return {
    permId: "weight_permission",
    body: {
      $: "And",
      left: {
        $: "Base",
        body: {
          $: "PermissionEnabled",
          pid: "transfer_permission"
        }
      },
      right: {
        $: "CompExpr",
        op: CompOp.Gt,
        left: {
          $: "WeightSet",
          from: "delegator",
          to: "delegate"
        },
        right: {
          $: "UIntLiteral",
          value: BigInt(1000)
        }
      }
    }
  };
}

// Test fact extraction from constraints
function testFactExtraction() {
  console.log("\n=== FACT EXTRACTION TEST ===");
  
  // Create a complex constraint
  const constraint = createComplexConstraint();
  
  // Extract facts
  const facts = extractFactsFromConstraint(constraint);
  
  console.log(`Extracted ${facts.length} facts from constraint:`);
  facts.forEach((fact, i) => {
    console.log(`Fact #${i + 1}: ${JSON.stringify(fact, (_, value) => 
      typeof value === 'bigint' ? value.toString() : value)}`);
  });
}

// Test Rete network basic functionality
function testReteBasics() {
  console.log("\n=== RETE NETWORK BASIC TEST ===");
  
  // Create Rete network
  const network = new ReteNetwork();
  
  // Add a constraint
  const constraint = createComplexConstraint();
  const prodId = network.addConstraint(constraint);
  
  console.log(`Added constraint with production node ID: ${prodId}`);
  
  // Check activation before adding facts
  console.log(`Constraint activated before facts: ${network.isConstraintActivated(prodId)}`);
  
  // Add facts that match the constraint
  const permFact: PermissionEnabledFact = {
    type: 'PermissionEnabled',
    permId: 'admin_access',
    enabled: true
  };
  
  const stakeFact: StakeOfFact = {
    type: 'StakeOf',
    account: 'user123',
    amount: BigInt(6000000)
  };
  
  console.log("Adding PermissionEnabled fact...");
  network.addFact(permFact);
  console.log(`Constraint activated after permission fact: ${network.isConstraintActivated(prodId)}`);
  
  console.log("Adding StakeOf fact...");
  network.addFact(stakeFact);
  console.log(`Constraint activated after both facts: ${network.isConstraintActivated(prodId)}`);
  
  // Get activations
  const activations = network.getConstraintActivations(prodId);
  console.log(`Number of activations: ${activations.length}`);
  
  if (activations.length > 0) {
    console.log("Facts in first activation:");
    for (const [key, fact] of activations[0].facts) {
      console.log(`  ${key}: ${JSON.stringify(fact, (_, value) => 
        typeof value === 'bigint' ? value.toString() : value)}`);
    }
  }
}

// Test Rete network with more complex scenario
function testReteWithWeightConstraint() {
  console.log("\n=== WEIGHT CONSTRAINT TEST ===");
  
  // Create Rete network
  const network = new ReteNetwork();
  
  // Add a constraint
  const constraint = createWeightConstraint();
  const prodId = network.addConstraint(constraint);
  
  console.log(`Added weight constraint with production node ID: ${prodId}`);
  
  // Add facts that match the constraint
  const permFact: PermissionEnabledFact = {
    type: 'PermissionEnabled',
    permId: 'transfer_permission',
    enabled: true
  };
  
  const weightFact: WeightSetFact = {
    type: 'WeightSet',
    from: 'delegator',
    to: 'delegate',
    amount: BigInt(2000)
  };
  
  console.log("Adding PermissionEnabled fact...");
  network.addFact(permFact);
  console.log(`Constraint activated after permission fact: ${network.isConstraintActivated(prodId)}`);
  
  console.log("Adding WeightSet fact...");
  network.addFact(weightFact);
  console.log(`Constraint activated after both facts: ${network.isConstraintActivated(prodId)}`);
}

// Test with multiple constraints and facts
function testMultipleConstraints() {
  console.log("\n=== MULTIPLE CONSTRAINTS TEST ===");
  
  // Create Rete network
  const network = new ReteNetwork();
  
  // Add two constraints
  const constraint1 = createComplexConstraint();
  const constraint2 = createWeightConstraint();
  
  const prodId1 = network.addConstraint(constraint1);
  const prodId2 = network.addConstraint(constraint2);
  
  console.log(`Added constraint 1 with production node ID: ${prodId1}`);
  console.log(`Added constraint 2 with production node ID: ${prodId2}`);
  
  // Add facts
  const facts = [
    { type: 'PermissionEnabled', permId: 'admin_access', enabled: true } as PermissionEnabledFact,
    { type: 'PermissionEnabled', permId: 'transfer_permission', enabled: true } as PermissionEnabledFact,
    { type: 'StakeOf', account: 'user123', amount: BigInt(6000000) } as StakeOfFact,
    { type: 'WeightSet', from: 'delegator', to: 'delegate', amount: BigInt(2000) } as WeightSetFact
  ];
  
  console.log("Adding all facts...");
  network.addFacts(facts);
  
  console.log(`Constraint 1 activated: ${network.isConstraintActivated(prodId1)}`);
  console.log(`Constraint 2 activated: ${network.isConstraintActivated(prodId2)}`);
  
  // Get all activated constraints
  const activated = network.getActivatedConstraints();
  console.log(`Total activated constraints: ${activated.size}`);
}

// Run all tests
console.log("=== RETE ALGORITHM TESTS ===");
testFactExtraction();
testReteBasics();
testReteWithWeightConstraint();
testMultipleConstraints();
console.log("\n=== TESTS COMPLETED ===");