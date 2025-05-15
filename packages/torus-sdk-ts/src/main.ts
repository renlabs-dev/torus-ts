/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-debugger */

import "@polkadot/api/augment";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { AbstractInt } from "@polkadot/types-codec";
import { IPFS_URI_SCHEMA } from "@torus-network/torus-utils/ipfs";
import { parseTorusTokens } from "@torus-network/torus-utils/subspace";
import { queryMinAllowedStake } from "./modules/subspace";
import {
  SbStorageDoubleMap,
  SbStorageMap,
  SbStorageValue,
} from "./substrate/storage";
import { sb_address, sb_balance, sb_bigint, sb_some, uint } from "./types";
import { assert } from "tsafe";

// $ pnpm exec tsx src/main.ts

const NODE_URL = "wss://api.torus.network";

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

const st = api.query.torus0.totalStake;

const totalStake_storage_def = new SbStorageValue(
  "torus0",
  "totalStake",
  sb_balance,
);
assert<typeof totalStake_storage_def.checkType>();

const registrationBlock_def = new SbStorageMap(
  "torus0",
  "registrationBlock",
  sb_address,
  sb_some(sb_bigint),
);
assert<typeof registrationBlock_def.checkType>();

const stakingTo_def = new SbStorageDoubleMap(
  "torus0",
  "stakingTo",
  sb_address,
  sb_address,
  sb_some(sb_bigint),
);

const val1 = await totalStake_storage_def.query(api)();
console.log("val1", val1);

const val2 = await registrationBlock_def.query(api)(
  "5HQGGEjU6BZjRF743oaEWYKM3sp9hGRgJqXEC6r9UnodM5nL",
);
console.log("val2", val2);

const val3 = await stakingTo_def.query(api)(
  "5HQGGEjU6BZjRF743oaEWYKM3sp9hGRgJqXEC6r9UnodM5nL",
  "5HQGGEjU6BZjRF743oaEWYKM3sp9hGRgJqXEC6r9UnodM5nL",
);
console.log("val3", val3);

debugger;

process.exit(0);
