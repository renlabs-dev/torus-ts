/* eslint-disable */

import "@polkadot/api/augment";

import { ApiPromise, WsProvider } from "@polkadot/api";

import { BasicLogger } from "@torus-network/torus-utils/logger";
import { formatToken } from "@torus-network/torus-utils/torus/token";

import { queryExtFee } from "./chain/common/index.js";
import { queryAgent, queryAgents } from "./chain/index.js";
import { SS58Address } from "./types/address.js";
import { sb_string } from "./types/index.js";

const log = BasicLogger.create({ name: "torus-sdk-ts.main" });

// // $ pnpm exec tsx src/main.ts

const NODE_URL = "wss://api-30.nodes.torus.network";

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

// =============================================================================

const agents = await queryAgent(
  api,
  "5Gh9rQWArgg2fsLDonJjHPvz3Q6yp66GZDnqBwxRYGAvNXib" as SS58Address,
);

console.log("Agents:", agents);

// Disconnect when done
await api.disconnect();
console.log("API disconnected");
