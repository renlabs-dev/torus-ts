/* eslint-disable */

import { ApiPromise, WsProvider } from "@polkadot/api";

import { BasicLogger } from "@torus-network/torus-utils/logger";

import { storageUnitTests } from "./substrate/";

const log = BasicLogger.create({ name: "torus-sdk-ts.main" });

// // $ pnpm exec tsx src/main.ts
:
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
const storage = createStorageRouter(api);
// const testResult = await exampleUsage(api);
// console.log(testResult);
// const x = await storage.system.number.get();
// const y = await api.query.system.number();
// console.log(y)
// console.log(x)

// // ====

// Test our storage wrapper functionality
await storageUnitTests(api);

// Disconnect when done
await api.disconnect();
console.log("API disconnected");
process.exit(0);
