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
import { checkSS58 } from "./address";

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

const addr = checkSS58("5Dw5xxnpgVAbBgXtxT1DEWKv3YJJxHGELZKHNCEWzRNKbXdL");

const map1 = await queryStakeIn(api);
const map2 = await queryStakeOut(api);
const r1 = await queryKeyStakedBy(
  api,
  checkSS58("5DJBFtDLxZ3cahV2zdUzbe5xJiZRqbJdRCdU3WL6txZNqBBj"),
);
const r2 = await queryKeyStakingTo(
  api,
  checkSS58("5DJBFtDLxZ3cahV2zdUzbe5xJiZRqbJdRCdU3WL6txZNqBBj"),
);

console.log(map1);
console.log(map2);
console.log(r1);
console.log(r2);

debugger;

process.exit(0);
