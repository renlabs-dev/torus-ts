/* eslint-disable */

import "@polkadot/api/augment";

import { ApiPromise, WsProvider } from "@polkadot/api";

import { BasicLogger } from "@torus-network/torus-utils/logger";
import { formatToken } from "@torus-network/torus-utils/subspace";

import { queryExtFee } from "./chain/common/index.js";
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

{
  // const cost = await queryNamespacePathCreationCost(
  //   api,
  //   "5E2X371Jg62WWmKVVhDNgfFNtjXTSKMQDGGWKgqimKUgZ9gX" as SS58Address,
  //   "agent.agent-test.alice.api.twitter.test",
  // );
  // console.log("Namespace path creation cost:", cost);
  // // [
  // //   undefined,
  // //   { fee: 16615066762142640128n, deposit: 27400000000000000000n }
  // // ]
  // const burnValue = await queryAgentBurn(api);
  // console.log("Burn value:", burnValue);
  // // Burn value: 15000000000000000000n
  // const ext = api.tx.torus0.registerAgent(
  //   "5E2X371Jg62WWmKVVhDNgfFNtjXTSKMQDGGWKgqimKUgZ9gX" as SS58Address,
  //   "agent.edmundo",
  //   "https://twitter.com/agent-test",
  //   "Twitter agent",
  // );
  // const info = await api.rpc.payment.queryInfo(ext.toU8a());
  // console.log("info:", info);
  // const feeDetails = await queryExtFeeInfo(api, ext);
  // console.log("Fee details:", feeDetails);
  // Fee for registerAgent:
  // - queryNamespacePathCreationCost (agent.name)
  // - queryAgentBurn (15 TORUS)
  // Fee for namespace creation:
  // - queryNamespacePathCreationCost (agent.name.alice.api.test)
  // // Create an example extrinsic (e.g., a balance transfer)
  // const ext = api.tx.balances.transferKeepAlive(
  //   "5Dr24SR8LCRsG3pGb4VjUE11yEjuvWhoHk4cLBmN85znWzp6",
  //   100000000000000,
  // );
  // const [error, feeRes] = await queryExtFee(
  //   ext,
  //   "5Dr24SR8LCRsG3pGb4VjUE11yEjuvWhoHk4cLBmN85znWzp6",
  // );
  // if (error !== undefined) throw error;
  // const { fee } = feeRes;
  // console.log(`Fee: ${fee} rems`);
  // console.log(`Fee: ${formatToken(fee, 9)} TORUS`);
}

const rawSpecName = api.runtimeVersion.specName;

const specName = sb_string.parse(rawSpecName);

console.log("specName:", specName);

// Disconnect when done
await api.disconnect();
console.log("API disconnected");
