/* eslint-disable @typescript-eslint/no-unused-vars */

import "@polkadot/api/augment";

import { ApiPromise, WsProvider } from "@polkadot/api";

import { checkSS58 } from "./address";
import {
  generateRootStreamId,
  PermissionContract,
  PermissionId,
  queryAccumulatedStreamsForAccount,
  queryPermissions,
  queryPermissionsByGrantee,
  queryPermissionsByGrantor,
  StreamId,
} from "./modules/permission0";
import { extractFromMap } from "@torus-network/torus-utils/collections";

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

// Get all permissions
const [e0, permissions] = await queryPermissions(api);
if (e0 !== undefined) {
  console.error("Query failed:", e0);
  process.exit(1);
}
console.log("Permissions:", permissions);

// ----

// Get ids of permission by a specific grantor
const [e1, permsFromFooIds] = await queryPermissionsByGrantor(
  api,
  "5Dw5xxnpgVAbBgXtxT1DEWKv3YJJxHGELZKHNCEWzRNKbXdL",
);
if (e1 !== undefined) {
  console.error("Query failed:", e1);
  process.exit(1);
}

console.log("Permissions by grantor:", permsFromFooIds);
console.log();
console.log();

// ----

// Get data of permissions by a specific grantor
const permsFromFoo = extractFromMap(permissions, permsFromFooIds);

for (const [id, perm] of permsFromFoo) {
  console.log("Permissions with id:", id);
  console.log(perm);
  // debugger;
  console.log();
}

// ----

await api.disconnect();

process.exit(0);
