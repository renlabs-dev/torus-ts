/* eslint-disable */

import "@polkadot/api/augment";

import { ApiPromise, WsProvider } from "@polkadot/api";

import { BasicLogger } from "@torus-network/torus-utils/logger";

import { storageUnitTests } from "./substrate/test-wrapers/tests-suit.js";

const log = BasicLogger.create({ name: "torus-sdk-ts.main" });

// TORUS token has 18 decimal places
// const TORUS_DECIMALS = 18;
// const TORUS_UNIT = BigInt(10 ** TORUS_DECIMALS);

// function formatTorus(amount: bigint): string {
//   const wholePart = amount / TORUS_UNIT;
//   const fractionalPart = amount % TORUS_UNIT;

//   if (fractionalPart === 0n) {
//     return `${wholePart.toString()} TORUS`;
//   }

//   // Convert fractional part to decimal string with leading zeros
//   const fractionalStr = fractionalPart.toString().padStart(TORUS_DECIMALS, "0");
//   // Remove trailing zeros
//   const trimmedFractional = fractionalStr.replace(/0+$/, "");

//   return `${wholePart.toString()}.${trimmedFractional} TORUS`;
// }

// // $ pnpm exec tsx src/main.ts

// const NODE_URL = "wss://api-30.nodes.torus.network";
const NODE_URL = "wss://api.testnet.torus.network";

async function connectToChainRpc(wsEndpoint: string) {
  const wsProvider = new WsProvider(wsEndpoint);
  const api = await ApiPromise.create({ provider: wsProvider });
  if (!api.isConnected) {
    throw new Error("API not connected");
  }
  console.log("API connected");
  return api;
}

const api = await connectToChainRpc(NODE_URL);

// // ====

// Test queryNamespaceEntriesOf and queryNamespacePathCreationCost functions
// import {
//   queryNamespaceEntriesOf,
//   queryNamespacePathCreationCost,
// } from "./modules/torus0.js";
// import type { SS58Address } from "./address.js";

// async function testQueryNamespaceEntriesOf() {
//   console.log("Testing queryNamespaceEntriesOf function...");

//   // Test with a sample agent address (you can replace this with an actual agent address)
//   const testAgentAddress = "5E2X371Jg62WWmKVVhDNgfFNtjXTSKMQDGGWKgqimKUgZ9gX"; // Alice's address

//   try {
//     const result = await queryNamespaceEntriesOf(
//       api,
//       testAgentAddress as SS58Address,
//     );
//     console.log("✅ queryNamespaceEntriesOf succeeded");
//     console.log("📊 Result:", result);

//     // The result is now an array of NamespaceEntry records
//     console.log("📈 Number of namespace entries:", result.length);

//     // Log first few entries if any exist
//     if (result.length > 0) {
//       console.log("🔍 Sample namespace entries:");
//       result.slice(0, 3).forEach((entry, index) => {
//         console.log(`  Entry ${index + 1}:`, {
//           path: entry.path,
//           createdAt: entry.createdAt,
//           deposit: entry.deposit,
//         });
//       });
//     } else {
//       console.log("ℹ️ No namespace entries found for this agent");
//     }
//   } catch (error) {
//     console.error("❌ queryNamespaceEntriesOf failed:", error);
//     console.error("Stack:", (error as Error).stack);
//   }
// }

// async function testQueryNamespacePathCreationCost() {
//   console.log("\nTesting queryNamespacePathCreationCost function...");

//   // Test with a sample agent address and namespace path
//   const testAgentAddress = "5E2X371Jg62WWmKVVhDNgfFNtjXTSKMQDGGWKgqimKUgZ9gX"; // Alice's address
//   const testNamespacePath = "agent.test-app.config";

//   console.log("🔍 Test parameters:");
//   console.log("  Agent Address:", testAgentAddress);
//   console.log("  Namespace Path:", testNamespacePath);

//   const [error, result] = await queryNamespacePathCreationCost(
//     api,
//     testAgentAddress as SS58Address,
//     testNamespacePath,
//   );

//   if (error !== undefined) {
//     console.error("❌ queryNamespacePathCreationCost failed:", error.message);
//     console.error("Stack:", error.stack);
//   } else {
//     console.log("✅ queryNamespacePathCreationCost succeeded");
//     console.log("💰 Cost breakdown:");
//     console.log("  Fee:", formatTorus(result.fee));
//     console.log("  Deposit:", formatTorus(result.deposit));
//     console.log("  Total Cost:", formatTorus(result.fee + result.deposit));
//     console.log("📊 Raw values:");
//     console.log("  Fee (raw):", result.fee.toString());
//     console.log("  Deposit (raw):", result.deposit.toString());
//   }
// }

// async function testQueryNamespacePathCreationCostWithInvalidPath() {
//   console.log("\nTesting queryNamespacePathCreationCost with invalid path...");

//   const testAgentAddress = "5E2X371Jg62WWmKVVhDNgfFNtjXTSKMQDGGWKgqimKUgZ9gX";
//   const invalidPath = "invalid..path"; // Invalid: double dots

//   console.log("🔍 Test parameters:");
//   console.log("  Agent Address:", testAgentAddress);
//   console.log("  Invalid Namespace Path:", invalidPath);

//   const [error, result] = await queryNamespacePathCreationCost(
//     api,
//     testAgentAddress as SS58Address,
//     invalidPath,
//   );

//   if (error !== undefined) {
//     console.log("✅ Expected error for invalid path:", error.message);
//   } else {
//     console.log("❌ Unexpected success for invalid path:", result);
//   }
// }

// // Run the tests
// // await testQueryNamespaceEntriesOf();
// await testQueryNamespacePathCreationCost();
// await testQueryNamespacePathCreationCostWithInvalidPath();

// ============================================================================
// STORAGE WRAPPER TESTS
// ============================================================================

// Run comprehensive tests for all 48 storage entries across 3 pallets
await storageUnitTests(api);

// Disconnect when done
await api.disconnect();
console.log("API disconnected");
