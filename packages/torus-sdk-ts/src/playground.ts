#!/usr/bin/env tsx

/**
 * Playground for testing SDK functions
 *
 * Run with: npx tsx src/playground.ts
 */

import { connectToChainRpc } from "./utils/index.js";
import {
  queryAgentNamespacePermissions,
  queryNamespacePermissions,
} from "./chain/permission0.js";
import { buildDelegationTree, DelegationTreeManager } from "./chain/delegation-tree-builder.js";
import type { SS58Address } from "./types/address.js";

const wsEndpoint = "wss://api.testnet.torus.network";
const testAddress =
  "5D5FbRRUvQxdQnJLgNW6BdgZ86CRGreKRahzhxmdSj2REBnt" as SS58Address;
async function main() {
  console.log("🔧 Starting SDK Playground...\n");

  try {
    // Connect to the chain
    console.log("📡 Connecting to chain...");
    const api = await connectToChainRpc(wsEndpoint);
    console.log("✅ Connected to chain\n");

    // Test 2: Query permissions for a specific agent
    console.log("\n🎯 Test 2: Querying permissions for specific agent...");

    if (testAddress) {
      console.log(`Testing with address: ${testAddress}`);

      const [agentPermissionsError, agentPermissions] =
        await queryAgentNamespacePermissions(api, testAddress);

      if (agentPermissionsError) {
        console.error(
          "❌ Error querying agent permissions:",
          agentPermissionsError,
        );
      } else {
        console.log(
          `✅ Found ${agentPermissions.size} permissions for agent ${testAddress}`,
        );

        // Show details of agent permissions
        for (const [permissionId, permission] of agentPermissions) {
          console.log(`\n  Permission ID: ${permissionId}`);
          console.log(`  Delegator: ${permission.delegator}`);
          console.log(`  Duration: ${JSON.stringify(permission.duration)}`);
          console.log(`  Revocation: ${JSON.stringify(permission.revocation)}`);
          console.log(`max instances: ${permission.maxInstances}`);

          // Show namespace paths if available
          if ("Namespace" in permission.scope) {
            console.log("  Namespace paths:");
            for (const [_, pathsArray] of permission.scope.Namespace.paths) {
              for (const path of pathsArray) {
                console.log(`    - ${path.join(".")}`);
              }
            }
          }
        }
      }
    } else {
      console.log("⚠️  No permissions found to test with");
    }

    // Test 3: Build delegation tree manager for the agent
    console.log("\n🌳 Test 3: Building delegation tree manager for agent...");
    
    if (testAddress) {
      const [managerError, treeManager] = await DelegationTreeManager.create(api, testAddress);
      
      if (managerError) {
        console.error("❌ Error building delegation tree manager:", managerError);
      } else {
        const nodes = treeManager.getNodes();
        const edges = treeManager.getEdges();
        console.log(`✅ Built delegation tree with ${nodes.length} nodes and ${edges.length} edges`);
        
        // Show tree structure with new redelegation count format
        console.log("\n📊 Delegation Tree Structure:");
        console.log("Nodes:");
        for (const node of nodes) {
          const accessIcon = node.accessible ? "✅" : "❌";
          const totalCount = treeManager.getTotalRedelegationCount(node.id);
          
          // Show detailed redelegation count breakdown
          const countDetails = Array.from(node.redelegationCount.entries())
            .map(([parent, count]) => `${parent}:${count === null ? "∞" : count}`)
            .join(", ");
          
          const totalDisplay = totalCount === null ? "∞" : totalCount;
          console.log(`  ${accessIcon} ${node.id}: "${node.label}" (total: ${totalDisplay}, breakdown: {${countDetails}})`);
        }
        
        console.log("\nEdges:");
        for (const edge of edges) {
          console.log(`  ${edge.source} → ${edge.target}`);
        }
        
        // Test cascading updates
        console.log("\n🔄 Testing cascading updates...");
        const sampleNode = nodes.find(n => n.accessible && n.redelegationCount.size > 0);
        if (sampleNode) {
          const [firstParent] = sampleNode.redelegationCount.keys();
          const originalCount = sampleNode.redelegationCount.get(firstParent!)!;
          
          console.log(`Original count for ${sampleNode.id} from ${firstParent}: ${originalCount}`);
          
          // Update the count
          treeManager.updateRedelegationCount(sampleNode.id, firstParent!, 99);
          
          console.log(`Updated count for ${sampleNode.id} from ${firstParent}: ${sampleNode.redelegationCount.get(firstParent!)}`);
          
          // Check if it cascaded to children
          const children = treeManager.getChildren(sampleNode.id);
          for (const childId of children) {
            const child = treeManager.getNode(childId);
            if (child && child.redelegationCount.has(firstParent!)) {
              console.log(`Cascaded to child ${childId}: ${child.redelegationCount.get(firstParent!)}`);
            }
          }
        }
        
        // Test weakest delegator finding
        console.log("\n🎯 Testing weakest delegator finding...");
        
        // Test with some example targets
        const testTargets = [
          "agent.dev01.arthur.doyle.run",
          "agent.dev01.arthur.doyle", 
          "agent.dev01.arthur",
          "agent.gumball.hello.post",
          "agent.nonexistent.namespace"
        ];
        
        for (const target of testTargets) {
          const weakest = treeManager.getWeakestDelegator(target);
          if (weakest) {
            const totalCount = treeManager.getTotalRedelegationCount(weakest.id);
            const countDisplay = totalCount === null ? "∞" : totalCount;
            console.log(`Target: ${target} → Weakest delegator: ${weakest.id} (${countDisplay} instances)`);
            
            // Show all possible delegators for comparison
            const allDelegators = treeManager.getAllDelegatorsFor(target);
            if (allDelegators.length > 1) {
              const alternatives = allDelegators.slice(1).map(d => {
                const count = treeManager.getTotalRedelegationCount(d.id);
                const display = count === null ? "∞" : count;
                return `${d.id}(${display})`;
              }).join(", ");
              console.log(`  Other options: ${alternatives}`);
            }
          } else {
            console.log(`Target: ${target} → No delegator available`);
          }
        }
      }
    } else {
      console.log("⚠️  No test address available for delegation tree");
    }

    await api.disconnect();
    console.log("\n🔌 Disconnected from chain");
    console.log("✨ Playground completed successfully!");
  } catch (error) {
    console.error("💥 Playground error:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n👋 Playground interrupted");
  process.exit(0);
});

// Run the playground
main().catch((error) => {
  console.error("💥 Fatal error:", error);
  process.exit(1);
});
