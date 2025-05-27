import {
  ReteNetwork,
  StakeOfFact,
  PermissionExistsFact,
  CompOp
} from '../src/index';

/**
 * Test the in-place updating of facts in the Rete network
 */
function testFactUpdates() {
  console.log("=== FACT UPDATING TEST ===");
  
  // Create Rete network
  const network = new ReteNetwork();
  
  // Create a constraint that checks if stake > 1000
  const constraint = {
    permId: 'stake_constraint',
    body: {
      $: 'CompExpr',
      op: CompOp.Gt,
      left: { $: 'StakeOf', account: 'alice' },
      right: { $: 'UIntLiteral', value: BigInt(1000) }
    }
  };
  
  // Add constraint to network
  const productionId = network.addConstraint(constraint);
  console.log(`Added constraint with production ID: ${productionId}`);
  
  // Add initial fact - stake of 500 (below threshold)
  console.log("\nAdding initial stake: 500");
  const initialStake: StakeOfFact = {
    type: 'StakeOf',
    account: 'alice',
    amount: BigInt(500)
  };
  
  const initialResult = network.addFact(initialStake);
  console.log(`Fact added - isNew: ${initialResult.isNew}, updated: ${initialResult.updated}`);
  console.log(`Constraint activated: ${network.isConstraintActivated(productionId)}`);
  
  // Visualize the network state
  console.log("\nNetwork state after initial fact:");
  console.log(network.visualizeNetwork());
  
  // Update the fact - increase stake to 1500 (above threshold)
  console.log("\nUpdating stake to 1500");
  const updatedStake: StakeOfFact = {
    type: 'StakeOf',
    account: 'alice',
    amount: BigInt(1500)
  };
  
  const updateResult = network.addFact(updatedStake);
  console.log(`Fact updated - isNew: ${updateResult.isNew}, updated: ${updateResult.updated}`);
  console.log(`Constraint activated: ${network.isConstraintActivated(productionId)}`);
  
  // Visualize the updated network state
  console.log("\nNetwork state after update:");
  console.log(network.visualizeNetwork());
  
  // Update the fact again - no change to constraint activation
  console.log("\nUpdating stake to 2000");
  const updatedStake2: StakeOfFact = {
    type: 'StakeOf',
    account: 'alice',
    amount: BigInt(2000)
  };
  
  const updateResult2 = network.addFact(updatedStake2);
  console.log(`Fact updated - isNew: ${updateResult2.isNew}, updated: ${updateResult2.updated}`);
  console.log(`Constraint activated: ${network.isConstraintActivated(productionId)}`);
  
  // Update the fact to below threshold
  console.log("\nUpdating stake back to 800");
  const updatedStake3: StakeOfFact = {
    type: 'StakeOf',
    account: 'alice',
    amount: BigInt(800)
  };
  
  const updateResult3 = network.addFact(updatedStake3);
  console.log(`Fact updated - isNew: ${updateResult3.isNew}, updated: ${updateResult3.updated}`);
  console.log(`Constraint activated: ${network.isConstraintActivated(productionId)}`);
  
  // Test more complex constraint with updates
  testComplexUpdates();
}

/**
 * Test updates with a more complex constraint
 */
function testComplexUpdates() {
  console.log("\n=== COMPLEX CONSTRAINT UPDATE TEST ===");
  
  // Create Rete network
  const network = new ReteNetwork();
  
  // Create a constraint that checks if stake > 1000 AND permission exists
  const constraint = {
    permId: 'complex_constraint',
    body: {
      $: 'And',
      left: {
        $: 'CompExpr',
        op: CompOp.Gt,
        left: { $: 'StakeOf', account: 'bob' },
        right: { $: 'UIntLiteral', value: BigInt(1000) }
      },
      right: {
        $: 'Base',
        body: { $: 'PermissionExists', pid: 'transfer_permission' }
      }
    }
  };
  
  // Add constraint to network
  const productionId = network.addConstraint(constraint);
  console.log(`Added complex constraint with production ID: ${productionId}`);
  
  // Add stake fact (above threshold)
  console.log("\nAdding stake fact: 1500");
  const stakeFact: StakeOfFact = {
    type: 'StakeOf',
    account: 'bob',
    amount: BigInt(1500)
  };
  
  network.addFact(stakeFact);
  console.log(`Constraint activated: ${network.isConstraintActivated(productionId)}`);
  
  // Add permission fact
  console.log("\nAdding permission fact: exists=true");
  const permFact: PermissionExistsFact = {
    type: 'PermissionExists',
    permId: 'transfer_permission',
    exists: true
  };
  
  network.addFact(permFact);
  console.log(`Constraint activated: ${network.isConstraintActivated(productionId)}`);
  
  // Update stake to below threshold
  console.log("\nUpdating stake to 800");
  const updatedStake: StakeOfFact = {
    type: 'StakeOf',
    account: 'bob',
    amount: BigInt(800)
  };
  
  network.addFact(updatedStake);
  console.log(`Constraint activated: ${network.isConstraintActivated(productionId)}`);
  
  // Update permission to false
  console.log("\nUpdating permission to exists=false");
  const updatedPerm: PermissionExistsFact = {
    type: 'PermissionExists',
    permId: 'transfer_permission',
    exists: false
  };
  
  network.addFact(updatedPerm);
  console.log(`Constraint activated: ${network.isConstraintActivated(productionId)}`);
  
  // Update both facts to satisfy constraint
  console.log("\nUpdating both facts to satisfy constraint");
  
  const finalStake: StakeOfFact = {
    type: 'StakeOf',
    account: 'bob',
    amount: BigInt(2000)
  };
  
  const finalPerm: PermissionExistsFact = {
    type: 'PermissionExists',
    permId: 'transfer_permission',
    exists: true
  };
  
  network.addFacts([finalStake, finalPerm]);
  console.log(`Constraint activated: ${network.isConstraintActivated(productionId)}`);
  
  // Visualize final network state
  console.log("\nFinal network state:");
  console.log(network.visualizeNetwork());
}

// Run the tests
testFactUpdates();