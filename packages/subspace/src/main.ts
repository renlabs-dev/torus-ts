/* eslint-disable @typescript-eslint/no-unused-vars */

import "@polkadot/api/augment";

import { ApiPromise, WsProvider } from "@polkadot/api";

import {
  getRewardAllocation,
  queryGlobalGovernanceConfig,
  queryNotDelegatingVotingPower,
} from "./queries";

// import { queryStakeFrom } from "./queries";

const wsProvider = new WsProvider(
  "wss://testnet-commune-api-node-1.communeai.net",
);
const api = await ApiPromise.create({ provider: wsProvider });

if (!api.isConnected) {
  throw new Error("API not connected");
}

console.log("API connected");

// console.log(await queryStakeFrom(api));

// const gov_config = await queryGlobalGovernanceConfig(api);
// const reward_alloc = getRewardAllocation(1000n, gov_config);

// console.log(`Governance config:`, gov_config);
// console.log(`Reward allocation:`, reward_alloc);

const not_delegating = await queryNotDelegatingVotingPower(api);

console.log(`Not delegating voting power:`, not_delegating);

process.exit(0);
