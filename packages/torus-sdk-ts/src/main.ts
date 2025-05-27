/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-debugger */

import "@polkadot/api/augment";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { IPFS_URI_SCHEMA } from "@torus-network/torus-utils/ipfs";
import { parseTorusTokens } from "@torus-network/torus-utils/subspace";
import { queryMinAllowedStake } from "./modules/subspace";
import { generateRootStreamId } from "./modules/permission0";
import { checkSS58 } from "./address";

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

// ====

// Test generateRootStreamId
const testAddress = checkSS58(
  "5Fk3whq9Fr7yhMfXVMuokMprdPn3PMwkBDGcTG9Cc5m3GMgk",
);
const rootStreamId = generateRootStreamId(testAddress);
console.log("Test Address:", testAddress);
console.log("Generated Root Stream ID:", rootStreamId);
console.log();

const streams = await api.query.permission0.accumulatedStreamAmounts.entries();

for (const [key, value] of streams) {
  const [accountId, streamId, permissionId] = key.args;
  console.log("accountId:", accountId.toHuman());
  console.log("streamId:", streamId.toHuman());
  console.log("permissionId:", permissionId.toHuman());
  console.log("value:", value.toHuman());
  console.log();
}

process.exit(0);
