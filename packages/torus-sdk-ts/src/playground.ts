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
import { DelegationTreeManager } from "./chain/delegation-tree-builder.js";
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
        
        // Show tree structure with new permission-based format
        console.log("\n📊 Delegation Tree Structure:");
        console.log("Nodes:");
        for (const node of nodes) {
          const accessIcon = node.accessible ? "✅" : "❌";
          const permissions = treeManager.getNodePermissions(node.id);
          
          // Show detailed permission breakdown
          const permissionDetails = Array.from(permissions.entries())
            .map(([permId, count]) => {
              const displayId = permId === "self" ? "self" : permId.slice(0, 8) + "...";
              return `${displayId}:${count === null ? "∞" : count}`;
            })
            .join(", ");
          
          console.log(`  ${accessIcon} ${node.id}: "${node.label}" (permissions: {${permissionDetails}})`);
        }
        
        console.log("\nEdges:");
        for (const edge of edges) {
          console.log(`  ${edge.source} → ${edge.target}`);
        }
        
        // Test permission updates
        console.log("\n🔄 Testing permission updates...");
        const allPermissions = treeManager.getAllPermissionCounts();
        const sampleNode = nodes.find(n => n.accessible && n.permissions.size > 0);
        
        if (sampleNode && sampleNode.permissions.size > 0) {
          const [firstPermission] = sampleNode.permissions;
          if (firstPermission && firstPermission !== "self") {
            const originalCount = allPermissions.get(firstPermission);
            
            console.log(`Original count for permission ${firstPermission.slice(0, 8)}...: ${originalCount}`);
            
            // Update the permission count globally
            treeManager.updatePermissionCount(firstPermission, 99);
            
            // Check the updated count
            const updatedPermissions = treeManager.getNodePermissions(sampleNode.id);
            const newCount = updatedPermissions.get(firstPermission);
            console.log(`Updated count for permission ${firstPermission.slice(0, 8)}...: ${newCount}`);
            
            // Show that it affects all nodes with this permission
            console.log("Affected nodes:");
            for (const node of nodes) {
              if (node.permissions.has(firstPermission)) {
                console.log(`  - ${node.id}`);
              }
            }
          }
        }
        
        // Test finding permission with most instances
        console.log("\n🏆 Testing finding permission with most instances...");
        const testNamespaces = ["agent.gumball.hello.post", "agent.dev01.arthur.doyle.run", "agent.kek.asd.nic"];
        
        for (const namespace of testNamespaces) {
          const best = treeManager.getPermissionWithMostInstances(namespace);
          if (best) {
            const displayId = best.permissionId === "self" ? "self" : best.permissionId.slice(0, 8) + "...";
            const displayCount = best.count === null ? "∞" : best.count;
            console.log(`${namespace} → Best permission: ${displayId} with ${displayCount} instances`);
          } else {
            console.log(`${namespace} → No permissions found`);
          }
        }
        
        // Test permission intersection
        console.log("\n🔀 Testing permission intersection...");
        const intersectionTests = [
          ["agent.gumball", "agent.gumball.hello", "agent.gumball.hello.post"],
          ["agent.dev01.arthur", "agent.dev01.arthur.doyle", "agent.dev01.arthur.doyle.run"],
          ["agent.gumball.hello.post", "agent.dev01.arthur.doyle.run"],
        ];
        
        for (const paths of intersectionTests) {
          const intersection = treeManager.getPermissionIntersection(paths);
          const permDetails = Array.from(intersection)
            .map(permId => permId === "self" ? "self" : permId.slice(0, 8) + "...")
            .join(", ");
          console.log(`Intersection of [${paths.join(", ")}]:`);
          console.log(`  → {${permDetails}}`);
        }
        
        // Test finding nodes with permissions
        console.log("\n🎯 Testing finding nodes with permissions...");
        
        // Test with some example targets
        const testTargets = [
          "agent.dev01.arthur.doyle.run",
          "agent.dev01.arthur.doyle", 
          "agent.dev01.arthur",
          "agent.gumball.hello.post",
          "agent.nonexistent.namespace"
        ];
        
        for (const target of testTargets) {
          const nodesWithPerms = treeManager.getNodesWithPermissionsFor(target);
          if (nodesWithPerms.length > 0) {
            console.log(`Target: ${target}`);
            for (const node of nodesWithPerms) {
              const permissions = treeManager.getNodePermissions(node.id);
              const permDetails = Array.from(permissions.entries())
                .map(([permId, count]) => {
                  const displayId = permId === "self" ? "self" : permId.slice(0, 8) + "...";
                  return `${displayId}:${count === null ? "∞" : count}`;
                })
                .join(", ");
              console.log(`  → ${node.id} (permissions: {${permDetails}})`);
            }
          } else {
            console.log(`Target: ${target} → No nodes with permissions available`);
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
