/* eslint-disable no-debugger */

import "@polkadot/api/augment";

import { ApiPromise, WsProvider } from "@polkadot/api";
import {
  formatTorusToken,
  fromRen,
  parseTorusTokens,
  toRen,
} from "@torus-ts/utils/subspace";

// import { queryCachedStakeFrom } from "./cached-queries";

// import { queryStakeIn, queryStakeOut } from "./modules/subspace";

// $ pnpm exec tsx src/main.ts

// const NODE_URL = "wss://testnet-commune-api-node-1.communeai.net";
// const NODE_URL = "wss://api.communeai.net";
const NODE_URL = "wss://api.communeai.net";

// const wsProvider = new WsProvider(NODE_URL);
// const api = await ApiPromise.create({ provider: wsProvider });
// if (!api.isConnected) {
//   throw new Error("API not connected");
// }
// console.log("API connected");

const tokens = fromRen(1_000_000_000_000_000_000n);
const x = tokens.div(3);
console.log("x:", x);
const back = toRen(x);
console.log("back:", back);
const tokens_2 = fromRen(back);
console.log("tokens_2:", tokens_2);
const txt = formatTorusToken(x);
console.log("formated:", `${txt} TOR`);
const parsed = parseTorusTokens(txt);
console.log(parsed);

// console.log("State out:");
// console.log(await queryStakeOut(api));

// console.log("Stake in:");
// console.log(await queryStakeIn(api));

// console.log("Cached state out:");
// console.log(await queryCachedStakeFrom("https://cache.torus.network"));

debugger;

process.exit(0);
