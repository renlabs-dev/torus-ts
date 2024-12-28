/* eslint-disable no-debugger */

import "@polkadot/api/augment";

import { queryFreeBalance } from "./modules/subspace";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { checkSS58 } from "./address";

// $ pnpm exec tsx src/main.ts

const NODE_URL = "wss://api-0.nodes.testnet.torus.network";

const wsProvider = new WsProvider(NODE_URL);
const api = await ApiPromise.create({ provider: wsProvider });
if (!api.isConnected) {
  throw new Error("API not connected");
}
console.log("API connected");

console.log("Free Balance:");
console.log(
  await queryFreeBalance(
    api,
    checkSS58("5Dw5xxnpgVAbBgXtxT1DEWKv3YJJxHGELZKHNCEWzRNKbXdL"),
  ),
);

// console.log("Staking To:");
// console.log(
//   await queryKeyStakingTo(
//     api,
//     checkSS58("5Dw5xxnpgVAbBgXtxT1DEWKv3YJJxHGELZKHNCEWzRNKbXdL"),
//   ),
// );

console.log(api.tx.torus0);

debugger;

process.exit(0);
