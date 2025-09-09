/* eslint-disable */
import "@polkadot/api/augment";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { Keyring } from "@polkadot/keyring";
import { BasicLogger } from "@torus-network/torus-utils/logger";
import { match } from "rustie";
import { queryBalance } from "./chain/balances.js";
import {
  parseSubmittableResult,
  sb_dispatch_error,
  sb_dispatch_info,
  sb_event_record,
  sb_extrinsic_status,
} from "./extrinsics.js";

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

console.log(
  await queryBalance(api, "5CoS1LXeGQDiXxZ8TcdiMuzyFKu9Ku7XAihu9iS2tCACxf4n"),
);

// Disconnect
await api.disconnect();
console.log("\n🔌 API disconnected");
