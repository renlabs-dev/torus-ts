/* eslint-disable */

import "@polkadot/api/augment";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { storageUnitTests, exampleUsage } from "./substrate/test-wrapers/tests-suit";

import { ApiPromise, WsProvider } from "@polkadot/api";

import { BasicLogger } from "@torus-network/torus-utils/logger";

const log = BasicLogger.create({ name: "torus-sdk-ts.main" });

// // $ pnpm exec tsx src/main.ts

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

// ============================================================================
// STORAGE WRAPPER TESTS
// ============================================================================

// Run comprehensive tests for all 48 storage entries across 3 pallets
await storageUnitTests(api);

// === EXPLORATION CODE (disabled, uncomment to explore blockchain structure) ===
// const allPallets = Object.keys(api.query).sort();
// console.log('Available pallets:', allPallets);
// const torus0Entries = Object.keys(api.query.torus0).sort();
// console.log('Torus0 entries:', torus0Entries);
// const systemEntries = Object.keys(api.query.system).sort(); 
// console.log('System entries:', systemEntries);
// const balancesEntries = Object.keys(api.query.balances).sort();
// console.log('Balances entries:', balancesEntries);

// === EXAMPLE USAGE (uncomment to see basic usage patterns) ===
// await exampleUsage(api);
// // ====

// Test queryNamespaceEntriesOf function
import { queryNamespaceEntriesOf } from "./modules/torus0.js";
import { SS58Address } from "./address.js";

async function testQueryNamespaceEntriesOf() {
  console.log("Testing queryNamespaceEntriesOf function...");

  // Test with a sample agent address (you can replace this with an actual agent address)
  const testAgentAddress = "5E2X371Jg62WWmKVVhDNgfFNtjXTSKMQDGGWKgqimKUgZ9gX"; // Alice's address

  try {
    const result = await queryNamespaceEntriesOf(
      api,
      testAgentAddress as SS58Address,
    );
    console.log("✅ queryNamespaceEntriesOf succeeded");
    console.log("📊 Result:", result);

    // The result is now an array of NamespaceEntry records
    console.log("📈 Number of namespace entries:", result.length);

    // Log first few entries if any exist
    if (result.length > 0) {
      console.log("🔍 Sample namespace entries:");
      result.slice(0, 3).forEach((entry, index) => {
        console.log(`  Entry ${index + 1}:`, {
          path: entry.path,
          createdAt: entry.createdAt,
          deposit: entry.deposit,
        });
      });
    } else {
      console.log("ℹ️ No namespace entries found for this agent");
    }
  } catch (error) {
    console.error("❌ queryNamespaceEntriesOf failed:", error);
    console.error("Stack:", (error as Error).stack);
  }
}

// Run the test
await testQueryNamespaceEntriesOf();



process.exit(0);
// Disconnect when done
await api.disconnect();
console.log("API disconnected");
