import {
  Constraint,
  CompOp,
  ChainAwareReteNetwork,
  DummyChainFetcher
} from '../src/index';

// Helper function to create a constraint with StakeOf
function createStakeConstraint(): Constraint {
  return {
    permId: "stake_permission",
    body: {
      $: "CompExpr",
      op: CompOp.Gt,
      left: {
        $: "StakeOf",
        account: "alice"
      },
      right: {
        $: "UIntLiteral",
        value: BigInt(1000)
      }
    }
  };
}

// Helper function to create a constraint with PermissionExists
function createPermissionConstraint(): Constraint {
  return {
    permId: "permission_check",
    body: {
      $: "Base",
      body: {
        $: "PermissionExists",
        pid: "admin_access"
      }
    }
  };
}

// Helper function to create a combined constraint (StakeOf AND PermissionExists)
function createCombinedConstraint(): Constraint {
  return {
    permId: "combined_permission",
    body: {
      $: "And",
      left: {
        $: "CompExpr",
        op: CompOp.Gte,
        left: {
          $: "StakeOf",
          account: "bob"
        },
        right: {
          $: "UIntLiteral",
          value: BigInt(5000)
        }
      },
      right: {
        $: "Base",
        body: {
          $: "PermissionExists",
          pid: "transfer_tokens"
        }
      }
    }
  };
}

// Test function for chain-aware Rete network
async function testChainAwareReteNetwork() {
  console.log("\n=== CHAIN-AWARE RETE NETWORK TEST ===\n");
  
  // Create a dummy fetcher for testing (no real chain connection)
  const fetcher = new DummyChainFetcher();
  const network = new ChainAwareReteNetwork(fetcher);
  
  console.log("🚀 Created ChainAwareReteNetwork with DummyChainFetcher\n");
  
  // Test 1: Simple StakeOf constraint
  console.log("📋 TEST 1: Simple StakeOf constraint");
  console.log("Constraint: StakeOf(alice) > 1000");
  
  const stakeConstraint = createStakeConstraint();
  const result1 = await network.addConstraintWithFacts(stakeConstraint);
  
  console.log(`✅ Added constraint, Production ID: ${result1.productionId}`);
  console.log(`📊 Fetched ${result1.fetchedFacts.length} facts from chain`);
  console.log(`🎯 Constraint activated: ${network.isConstraintActivated(result1.productionId)}`);
  
  if (result1.fetchedFacts.length > 0) {
    console.log("Facts fetched:");
    result1.fetchedFacts.forEach(fact => {
      if (fact.type === 'StakeOf') {
        console.log(`  - StakeOf(${fact.account}): ${fact.amount}`);
      }
    });
  }
  
  console.log("\n" + "=".repeat(60) + "\n");
  
  // Test 2: PermissionExists constraint
  console.log("📋 TEST 2: PermissionExists constraint");
  console.log("Constraint: PermissionExists(admin_access)");
  
  const permConstraint = createPermissionConstraint();
  const result2 = await network.addConstraintWithFacts(permConstraint);
  
  console.log(`✅ Added constraint, Production ID: ${result2.productionId}`);
  console.log(`📊 Fetched ${result2.fetchedFacts.length} facts from chain`);
  console.log(`🎯 Constraint activated: ${network.isConstraintActivated(result2.productionId)}`);
  
  if (result2.fetchedFacts.length > 0) {
    console.log("Facts fetched:");
    result2.fetchedFacts.forEach(fact => {
      if (fact.type === 'PermissionExists') {
        console.log(`  - PermissionExists(${fact.permId}): ${fact.exists}`);
      }
    });
  }
  
  console.log("\n" + "=".repeat(60) + "\n");
  
  // Test 3: Combined constraint (StakeOf AND PermissionExists)
  console.log("📋 TEST 3: Combined constraint");
  console.log("Constraint: StakeOf(bob) >= 5000 AND PermissionExists(transfer_tokens)");
  
  const combinedConstraint = createCombinedConstraint();
  const result3 = await network.addConstraintWithFacts(combinedConstraint);
  
  console.log(`✅ Added constraint, Production ID: ${result3.productionId}`);
  console.log(`📊 Fetched ${result3.fetchedFacts.length} facts from chain`);
  console.log(`🎯 Constraint activated: ${network.isConstraintActivated(result3.productionId)}`);
  
  if (result3.fetchedFacts.length > 0) {
    console.log("Facts fetched:");
    result3.fetchedFacts.forEach(fact => {
      if (fact.type === 'StakeOf') {
        console.log(`  - StakeOf(${fact.account}): ${fact.amount}`);
      } else if (fact.type === 'PermissionExists') {
        console.log(`  - PermissionExists(${fact.permId}): ${fact.exists}`);
      }
    });
  }
  
  console.log("\n" + "=".repeat(60) + "\n");
  
  // Show network visualization
  console.log("🔍 RETE NETWORK VISUALIZATION:");
  console.log(network.visualizeNetwork());
  
  // Summary
  console.log("\n📈 SUMMARY:");
  console.log(`Total constraints added: 3`);
  console.log(`Constraint 1 (StakeOf) activated: ${network.isConstraintActivated(result1.productionId)}`);
  console.log(`Constraint 2 (PermissionExists) activated: ${network.isConstraintActivated(result2.productionId)}`);
  console.log(`Constraint 3 (Combined) activated: ${network.isConstraintActivated(result3.productionId)}`);
  
  return {
    network,
    results: [result1, result2, result3]
  };
}

// Main execution
async function main() {
  try {
    console.log("🧪 Starting Chain-Aware Rete Network Test...");
    const testResult = await testChainAwareReteNetwork();
    console.log("\n✅ Test completed successfully!");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    throw error;
  }
}

// Export for running
export { testChainAwareReteNetwork, main };

// If this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}