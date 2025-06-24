/* eslint-disable */

import "@polkadot/api/augment";

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

    // The result is now an array of tuples: [pathSegments, metadata]
    console.log("📈 Number of namespace entries:", result.length);

    // Log first few entries if any exist
    if (result.length > 0) {
      console.log("🔍 Sample namespace entries:");
      result.slice(0, 3).forEach((entry, index) => {
        const [pathSegments, metadata] = entry;
        console.log(`  Entry ${index + 1}:`, pathSegments, "=>", metadata);
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

// Disconnect when done
await api.disconnect();
console.log("API disconnected");
