/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-debugger */

import "@polkadot/api/augment";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { comprehensiveStorageTests, exampleUsage } from "./substrate/test-wrapers/tests-suit";

// $ pnpm exec tsx src/main.ts

const NODE_URL = "wss://api.testnet.torus.network";

async function connectToChainRpc(wsEndpoint: string) {
  const wsProvider = new WsProvider(NODE_URL);
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
await comprehensiveStorageTests(api);

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

debugger;



process.exit(0);
