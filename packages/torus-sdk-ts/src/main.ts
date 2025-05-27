/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/consistent-type-imports */

import "@polkadot/api/augment";

import { ApiPromise, WsProvider } from "@polkadot/api";

import { checkSS58 } from "./address";
import {
  generateRootStreamId,
  queryAccumulatedStreamsForAccount,
  queryPermissions,
  queryPermissionsByGrantor,
  StreamId,
} from "./modules/permission0";

// $ pnpm exec tsx src/main.ts

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

// ====

const [e0, r0] = await queryPermissions(api);
if (e0 !== undefined) {
  console.error("Query failed:", e0);
  process.exit(1);
}
console.log("Permissions:", r0);

// ====

const [e1, r1] = await queryPermissionsByGrantor(
  api,
  "5Dw5xxnpgVAbBgXtxT1DEWKv3YJJxHGELZKHNCEWzRNKbXdL",
);
if (e1 !== undefined) {
  console.error("Query failed:", e1);
  process.exit(1);
}

console.log("Permissions by grantor:", r1);
console.log();
console.log();

// --

const testAccount = checkSS58(
  "5Guyw73fh7UvPXPtQ1bGqoTS8DRoZJHd2PTGwxS8PhHAN8HG",
);
console.log("Testing with account:", testAccount);
console.log();

const result = await queryAccumulatedStreamsForAccount(api, testAccount);

const [error, streamsMap] = result;

const streamIds = new Set<StreamId>();

if (error !== undefined) {
  console.error("Query failed:", error);
} else {
  console.log(`Found accumulated streams for ${streamsMap.size} stream(s)`);

  for (const [streamId, permissionsMap] of streamsMap) {
    console.log(`\nStream ID: ${streamId}`);
    console.log(`  Permissions count: ${permissionsMap.size}`);

    for (const [permissionId, amount] of permissionsMap) {
      console.log(`  Permission ID: ${permissionId}`);
      console.log(`  Amount: ${amount.toString()}`);
    }

    streamIds.add(streamId);
    console.log();
  }
}

const rootStreamIdForAccount = generateRootStreamId(testAccount);

const allStreamIds = [rootStreamIdForAccount, ...streamIds];

console.log(`All stream IDs for account ${testAccount}:`, allStreamIds);

await api.disconnect();

process.exit(0);
