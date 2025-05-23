/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-debugger */

import "@polkadot/api/augment";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { IPFS_URI_SCHEMA } from "@torus-network/torus-utils/ipfs";
import { parseTorusTokens } from "@torus-network/torus-utils/subspace";
import { queryMinAllowedStake } from "./modules/subspace";

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

// const r1 = IPFS_URI_SCHEMA.safeParse(
//   "ipfs://QmPK1s3pNYLi9ERiq3BDxKa4XosgWwFRQUydHUtz4YgpqB",
// );

// const r2 = IPFS_URI_SCHEMA.safeParse(
//   "ipfs://bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi",
// );

// console.log(r1, "\n", r1.error?.format());

// console.log(r2.data, "\n", r2.error?.format());

const x = parseTorusTokens("100.5");
const y = parseTorusTokens("1.3");
const r = x.plus(y);

console.log(r.toString());
console.log(r.toFixed(2));

debugger;

api.consts.emission0.blockEmission.toBigInt();

process.exit(0);
