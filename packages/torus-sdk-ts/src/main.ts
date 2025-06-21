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
import { createStorageRouter } from "./substrate/test-wrapers";
import { createStorageMap } from "./substrate/factory";
import { exampleUsage } from "./substrate/test-wrapers/example-usage";
import type { GenericAccountId } from "@polkadot/types";
import { create } from "multiformats/hashes/digest";

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
const storage = createStorageRouter(api);
// const testResult = await exampleUsage(api);
// console.log(testResult);
// const x = await storage.system.number.get();
// const y = await api.query.system.number();
// console.log(y)
// console.log(x)


// Get agent keys using direct API instead of storage wrapper
const agentKeys = await storage.torus0.agents.keys();
const firstAgentKey = agentKeys[0] ?? "0x0";

// console.log("============= TORUS0 PALLET =============");
// // DEFINITIONS
const totalStake = await storage.torus0.totalStake.get();
const agentUpdateCooldown = await storage.torus0.agentUpdateCooldown.get();
const burn = await storage.torus0.burn.get();
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
const firstAgent = await storage.torus0.agents.get(firstAgentKey as unknown as GenericAccountId);

// // LOGS
console.log('Total stake:', totalStake);
console.log('Agent update cooldown:', agentUpdateCooldown);
console.log('Burn amount:', burn);
console.log('Total agents registered:', agentKeys.length);
console.log('First agent Key: ', firstAgentKey);
console.log('First agent (storage wrapper): ', firstAgent);
// ====

// // const st = api.query.torus0.totalStake;

// // const totalStake_storage_def = new SbStorageValue(
// //   "torus0",
// //   "totalStake",
// //   sb_balance,
// // );
// // assert<typeof totalStake_storage_def.checkType>();

// // const registrationBlock_def = new SbStorageMap(
// //   "torus0",
// //   "registrationBlock",
// //   sb_address,
// //   sb_some(sb_bigint),
// // );
// // // assert<typeof registrationBlock_def.checkType>();

// // const stakingTo_def = new SbStorageDoubleMap(
// //   "torus0",
// //   "stakingTo",
// //   sb_address,
// //   sb_address,
// //   sb_some(sb_bigint),
// // );

// // const val1 = await totalStake_storage_def.query(api)();
// // console.log("val1", val1);

// // const val2 = await registrationBlock_def.query(api)(
// //   "5HQGGEjU6BZjRF743oaEWYKM3sp9hGRgJqXEC6r9UnodM5nL",
// // );
// // console.log("val2", val2);

// // const val3 = await stakingTo_def.query(api)(
// //   "5HQGGEjU6BZjRF743oaEWYKM3sp9hGRgJqXEC6r9UnodM5nL",
// //   "5HQGGEjU6BZjRF743oaEWYKM3sp9hGRgJqXEC6r9UnodM5nL",
// // );
// // console.log("val3", val3);




//   // Create storage router (single entry point)
//   // const storage = createStorageRouter(api);

//   // console.log("starting tests")
//   // // Simple queries
//   // const totalStake = await storage.torus0.totalStake.get();
//   // console.log('Total stake:', totalStake);

//   // const burn = await storage.torus0.burn.get();
//   // console.log('Burn:', burn);


//   // // Subscribe to changes
//   // const unsub = await storage.torus0.totalStake.subscribe((value) => {
//   //   console.log('Total stake updated:', value);
//   // });

//   // // Query at specific block
//   // // const historicalStake = await storage.torus0.totalStake.at('0xSomeBlockHash');
//   // // console.log('Historical stake:', historicalStake);

//   // // Clean up
//   // void unsub;


debugger;



process.exit(0);
