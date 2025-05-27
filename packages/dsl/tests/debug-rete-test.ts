import {
  Constraint,
  CompOp,
  ReteNetwork,
  StakeOfFact,
  PermissionExistsFact,
  extractFactsFromConstraint
} from '../src/index';

// Simple StakeOf constraint for debugging
function createSimpleStakeConstraint(): Constraint {
  return {
    permId: "debug_stake",
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

// Simple PermissionExists constraint for debugging
function createSimplePermissionConstraint(): Constraint {
  return {
    permId: "debug_permission",
    body: {
      $: "Base",
      body: {
        $: "PermissionExists",
        pid: "admin_access"
      }
    }
  };
}

async function debugReteNetwork() {
  console.log("🔬 DEBUGGING RETE NETWORK STEP BY STEP\n");
  
  // Create a basic Rete network
  const network = new ReteNetwork();
  
  console.log("1️⃣ TESTING SIMPLE STAKE CONSTRAINT");
  console.log("==================================\n");
  
  const stakeConstraint = createSimpleStakeConstraint();
  console.log("Constraint:", JSON.stringify(stakeConstraint, (key, value) => 
    typeof value === 'bigint' ? value.toString() + 'n' : value, 2));
  
  // Extract facts to understand what's expected
  const extractedFacts = extractFactsFromConstraint(stakeConstraint);
  console.log("\nExtracted facts from constraint:");
  extractedFacts.forEach((fact, i) => {
    console.log(`  ${i + 1}. ${fact.type}:`, fact);
  });
  
  // Add constraint to network
  console.log("\n📝 Adding constraint to network...");
  const prodId1 = network.addConstraint(stakeConstraint);
  console.log(`Production ID: ${prodId1}`);
  
  // Check network state after adding constraint
  console.log("\n📊 Network state after adding constraint:");
  console.log(network.visualizeNetwork());
  
  // Create and add matching fact manually
  console.log("\n💾 Creating and adding StakeOf fact manually...");
  const stakeFact: StakeOfFact = {
    type: 'StakeOf',
    account: 'alice',
    amount: BigInt(1500) // Should satisfy > 1000
  };
  
  console.log("Fact to add:", stakeFact);
  
  // Add fact and check if it propagates
  console.log("\n⚡ Adding fact to network...");
  network.addFact(stakeFact);
  
  // Check network state after adding fact
  console.log("\n📊 Network state after adding fact:");
  console.log(network.visualizeNetwork());
  
  // Check constraint activation
  const isActivated1 = network.isConstraintActivated(prodId1);
  console.log(`\n🎯 Constraint activated: ${isActivated1}`);
  
  if (isActivated1) {
    const activations = network.getConstraintActivations(prodId1);
    console.log(`📋 Number of activations: ${activations.length}`);
    if (activations.length > 0) {
      console.log("Facts in activation:");
      for (const [key, fact] of activations[0].facts) {
        console.log(`  ${key}:`, fact);
      }
    }
  }
  
  console.log("\n" + "=".repeat(50) + "\n");
  
  console.log("2️⃣ TESTING SIMPLE PERMISSION CONSTRAINT");
  console.log("=======================================\n");
  
  const permConstraint = createSimplePermissionConstraint();
  console.log("Constraint:", JSON.stringify(permConstraint, (key, value) => 
    typeof value === 'bigint' ? value.toString() + 'n' : value, 2));
  
  // Extract facts
  const extractedPermFacts = extractFactsFromConstraint(permConstraint);
  console.log("\nExtracted facts from constraint:");
  extractedPermFacts.forEach((fact, i) => {
    console.log(`  ${i + 1}. ${fact.type}:`, fact);
  });
  
  // Add constraint
  console.log("\n📝 Adding constraint to network...");
  const prodId2 = network.addConstraint(permConstraint);
  console.log(`Production ID: ${prodId2}`);
  
  // Create and add matching fact
  console.log("\n💾 Creating and adding PermissionExists fact manually...");
  const permFact: PermissionExistsFact = {
    type: 'PermissionExists',
    permId: 'admin_access',
    exists: true
  };
  
  console.log("Fact to add:", permFact);
  
  // Add fact
  console.log("\n⚡ Adding fact to network...");
  network.addFact(permFact);
  
  // Check final network state
  console.log("\n📊 Final network state:");
  console.log(network.visualizeNetwork());
  
  // Check both constraint activations
  const isActivated2 = network.isConstraintActivated(prodId2);
  console.log(`\n🎯 Stake constraint activated: ${network.isConstraintActivated(prodId1)}`);
  console.log(`🎯 Permission constraint activated: ${isActivated2}`);
  
  // Debug alpha node details
  console.log("\n🔍 DEBUGGING ALPHA NODES:");
  console.log("========================");
  
  // Check working memory
  console.log("\n💾 Working Memory Contents:");
  // The visualizeNetwork already shows this, but let's trace the specific alpha nodes
  
  return {
    network,
    stakeActivated: network.isConstraintActivated(prodId1),
    permissionActivated: network.isConstraintActivated(prodId2)
  };
}

// Main execution
async function main() {
  try {
    console.log("🧪 Starting Rete Network Debug Session...\n");
    const result = await debugReteNetwork();
    
    console.log("\n📈 DEBUG SUMMARY:");
    console.log("================");
    console.log(`Stake constraint activated: ${result.stakeActivated}`);
    console.log(`Permission constraint activated: ${result.permissionActivated}`);
    
    if (!result.stakeActivated && !result.permissionActivated) {
      console.log("\n❌ Both constraints failed to activate - debugging needed!");
    } else if (result.stakeActivated && result.permissionActivated) {
      console.log("\n✅ Both constraints activated successfully!");
    } else {
      console.log("\n⚠️  Mixed results - partial success");
    }
    
  } catch (error) {
    console.error("\n❌ Debug session failed:", error);
    throw error;
  }
}

// Export for running
export { debugReteNetwork, main };

// If this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}