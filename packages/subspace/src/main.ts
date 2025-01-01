/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-debugger */

import { ApiPromise, WsProvider } from "@polkadot/api";
import "@polkadot/api/augment";

import {
  queryFreeBalance,
  queryKeyStakedBy,
  queryKeyStakingTo,
  queryStakeIn,
  queryStakeOut,
} from "./modules/subspace";

// $ pnpm exec tsx src/main.ts

const NODE_URL = "wss://api.testnet.torus.network";

const wsProvider = new WsProvider(NODE_URL);
const api = await ApiPromise.create({ provider: wsProvider });
if (!api.isConnected) {
  throw new Error("API not connected");
}
console.log("API connected");

// ====

// console.log(
//   "Free Balance:",
//   await queryFreeBalance(
//     api,
//     checkSS58("5Dw5xxnpgVAbBgXtxT1DEWKv3YJJxHGELZKHNCEWzRNKbXdL"),
//   ),
// );

// console.log("Staking To:");
// console.log(
//   await queryKeyStakingTo(
//     api,
//     checkSS58("5Dw5xxnpgVAbBgXtxT1DEWKv3YJJxHGELZKHNCEWzRNKbXdL"),
//   ),
// );

debugger;

process.exit(0);
