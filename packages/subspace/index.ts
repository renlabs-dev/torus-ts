import "@polkadot/api-augment";

import { ApiPromise, WsProvider } from "@polkadot/api";

// import { queryStakeFrom } from "./queries";

// == To run this file: npx tsx index.ts ==

console.log("Hello from Subspace!");

// == Start API ==

const wsProvider = new WsProvider(
  "wss://testnet-torus-api-node-1.torusai.net",
);
const api = await ApiPromise.create({ provider: wsProvider });

if (!api.isConnected) {
  throw new Error("API not connected");
}

console.log("API connected");

// console.log(await queryStakeFrom(api));
