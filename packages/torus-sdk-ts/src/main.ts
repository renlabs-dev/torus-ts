/* eslint-disable */

import { ApiPromise, WsProvider } from "@polkadot/api";

import { BasicLogger } from "@torus-network/torus-utils/logger";

import { storageUnitTests } from "./substrate/test-wrapers/tests-suit.js";

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

// Test our storage wrapper functionality
await storageUnitTests(api);



process.exit(0);
// Disconnect when done
await api.disconnect();
console.log("API disconnected");
process.exit(0);
