import {
  ReteNetwork,
  StakeOfFact,
  PermissionExistsFact,
  WeightSetFact,
  MaxDelegationDepthFact,
  PermissionEnabledFact,
  CompOp
} from '../src/index';

// Helper function to log facts in a token
function logTokenFacts(token: any) {
  for (const [key, fact] of token.facts.entries()) {
    console.log(`  ${key}: ${JSON.stringify(fact, (_, value) => 
      typeof value === 'bigint' ? value.toString() : value)}`);
  }
}

// Test with mock facts
function testReteWithMockFacts() {
  console.log("\n=== RETE NETWORK MOCK TEST ===");
  
  // Create Rete network
  const network = new ReteNetwork();

  // Mock constraint (StakeOf > 1000 AND Permission exists)
  const constraint = {
    permId: 'test_permission',
    body: {
      $: 'And',
      left: {
        $: 'CompExpr',
        op: CompOp.Gt,
        left: { $: 'StakeOf', account: 'alice' },
        right: { $: 'UIntLiteral', value: BigInt(1000) }
      },
      right: {
        $: 'Base',
        body: { $: 'PermissionExists', pid: 'transfer_tokens' }
      }
    }
  };

  // Add constraint to network
  console.log('Adding constraint to Rete network...');
  const productionId = network.addConstraint(constraint);
  console.log(`Production node ID: ${productionId}`);

  // Check activation before adding facts
  console.log(`Constraint activated before facts: ${network.isConstraintActivated(productionId)}`);

  // Add StakeOf fact for alice
  console.log('Adding StakeOf fact for alice (2000)...');
  const stakeOfFact: StakeOfFact = {
    type: 'StakeOf',
    account: 'alice',
    amount: BigInt(2000)
  };
  network.addFact(stakeOfFact);

  // Check activation after one fact
  console.log(`Constraint activated after one fact: ${network.isConstraintActivated(productionId)}`);

  // Add PermissionExists fact
  console.log('Adding PermissionExists fact for transfer_tokens...');
  const permissionFact: PermissionExistsFact = {
    type: 'PermissionExists',
    permId: 'transfer_tokens',
    exists: true
  };
  network.addFact(permissionFact);

  // Check activation after both facts
  console.log(`Constraint activated after both facts: ${network.isConstraintActivated(productionId)}`);

  // Get activation details
  const activations = network.getConstraintActivations(productionId);
  console.log(`Number of activations: ${activations.length}`);

  if (activations.length > 0) {
    console.log('Facts in activation:');
    logTokenFacts(activations[0]);
  }

  // Test with different facts
  console.log('\nTesting with different account (bob)...');
  const bobStakeFact: StakeOfFact = {
    type: 'StakeOf',
    account: 'bob',
    amount: BigInt(5000)
  };
  network.addFact(bobStakeFact);

  // Get all activated constraints
  const activated = network.getActivatedConstraints();
  console.log(`Total activated constraints: ${activated.size}`);

  // Testing joining with weight facts
  console.log('\nTesting with WeightSet facts...');
  // New constraint: WeightSet from alice to bob > 500
  const weightConstraint = {
    permId: 'weight_permission',
    body: {
      $: 'CompExpr',
      op: CompOp.Gt,
      left: { $: 'WeightSet', from: 'alice', to: 'bob' },
      right: { $: 'UIntLiteral', value: BigInt(500) }
    }
  };

  const weightProdId = network.addConstraint(weightConstraint);
  console.log(`Weight constraint production ID: ${weightProdId}`);

  // Add WeightSet fact
  const weightSetFact: WeightSetFact = {
    type: 'WeightSet',
    from: 'alice',
    to: 'bob',
    amount: BigInt(1000)
  };
  network.addFact(weightSetFact);

  console.log(`Weight constraint activated: ${network.isConstraintActivated(weightProdId)}`);

  // Test with permission depth
  console.log('\nTesting with MaxDelegationDepth constraint...');
  const depthConstraint = {
    permId: 'depth_permission',
    body: {
      $: 'Base',
      body: {
        $: 'MaxDelegationDepth',
        depth: { $: 'UIntLiteral', value: BigInt(3) }
      }
    }
  };

  const depthProdId = network.addConstraint(depthConstraint);

  // Add MaxDelegationDepth fact
  const depthFact: MaxDelegationDepthFact = {
    type: 'MaxDelegationDepth',
    permId: 'depth_permission',
    depth: { $: 'UIntLiteral', value: BigInt(3) },
    actualDepth: BigInt(2)
  };
  network.addFact(depthFact);

  console.log(`Depth constraint activated: ${network.isConstraintActivated(depthProdId)}`);

  // Test complex joins with multiple related facts
  console.log('\nTesting with multiple related facts...');
  const complexConstraint = {
    permId: 'complex_permission',
    body: {
      $: 'And',
      left: {
        $: 'Base',
        body: {
          $: 'PermissionEnabled',
          pid: 'transfer_tokens'
        }
      },
      right: {
        $: 'And',
        left: {
          $: 'CompExpr',
          op: CompOp.Gt,
          left: { $: 'StakeOf', account: 'alice' },
          right: { $: 'UIntLiteral', value: BigInt(1000) }
        },
        right: {
          $: 'CompExpr',
          op: CompOp.Gt,
          left: { $: 'WeightSet', from: 'alice', to: 'charlie' },
          right: { $: 'UIntLiteral', value: BigInt(500) }
        }
      }
    }
  };

  const complexProdId = network.addConstraint(complexConstraint);

  // Add related facts
  const permEnabledFact: PermissionEnabledFact = {
    type: 'PermissionEnabled',
    permId: 'transfer_tokens',
    enabled: true
  };
  network.addFact(permEnabledFact);

  const charlieWeightFact: WeightSetFact = {
    type: 'WeightSet',
    from: 'alice',
    to: 'charlie',
    amount: BigInt(1500)
  };
  network.addFact(charlieWeightFact);

  console.log(`Complex constraint activated: ${network.isConstraintActivated(complexProdId)}`);

  // Print summary
  console.log('\nSummary of constraint activations:');
  console.log(`Basic constraint: ${network.isConstraintActivated(productionId)}`);
  console.log(`Weight constraint: ${network.isConstraintActivated(weightProdId)}`);
  console.log(`Depth constraint: ${network.isConstraintActivated(depthProdId)}`);
  console.log(`Complex constraint: ${network.isConstraintActivated(complexProdId)}`);
  
  // Print network visualization
  console.log('\n' + network.visualizeNetwork());

  console.log('\nTest completed!');
}

// Run the test
testReteWithMockFacts();