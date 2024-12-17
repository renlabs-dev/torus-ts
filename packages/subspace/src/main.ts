/* eslint-disable no-debugger */

import "@polkadot/api/augment";

import { ApiPromise, WsProvider } from "@polkadot/api";

import { queryCachedStakeFrom } from "./cached-queries";

// import { queryStakeIn, queryStakeOut } from "./modules/subspace";

// $ pnpm exec tsx src/main.ts

// const NODE_URL = "wss://testnet-commune-api-node-1.communeai.net";
// const NODE_URL = "wss://api.communeai.net";
const NODE_URL = "wss://api.communeai.net";

const wsProvider = new WsProvider(NODE_URL);
const api = await ApiPromise.create({ provider: wsProvider });

if (!api.isConnected) {
  throw new Error("API not connected");
}

console.log("API connected");

// console.log("State out:");
// console.log(await queryStakeOut(api));

// console.log("Stake in:");
// console.log(await queryStakeIn(api));

console.log("Cached state out:");
console.log(await queryCachedStakeFrom("https://cache.torus.network"));

debugger;

process.exit(0);
