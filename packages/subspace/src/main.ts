/* eslint-disable no-debugger */
/* eslint-disable @typescript-eslint/no-unused-vars */

import "@polkadot/api/augment";

import { ApiPromise, WsProvider } from "@polkadot/api";
import { match } from "rustie";

import { SS58_SCHEMA } from "./address";
import { PROPOSAL_SCHEMA } from "./modules/governance";
import { TOKEN_AMOUNT_SCHEMA } from "./old_types";
import {
  getRewardAllocation,
  queryGlobalGovernanceConfig,
  queryNotDelegatingVotingPower,
} from "./queries";
import {
  sb_address,
  sb_array,
  sb_bigint,
  sb_enum,
  sb_null,
  sb_string,
  sb_struct,
} from "./types";

// import { queryStakeFrom } from "./queries";

// const NODE_URL = "wss://testnet-commune-api-node-1.communeai.net";
const NODE_URL = "wss://api.communeai.net";

const wsProvider = new WsProvider(NODE_URL);
const api = await ApiPromise.create({ provider: wsProvider });

if (!api.isConnected) {
  throw new Error("API not connected");
}

console.log("API connected");

// console.log(await queryStakeFrom(api));

// const gov_config = await queryGlobalGovernanceConfig(api);
// const reward_alloc = getRewardAllocation(gov_config, 1000n);
// console.log(`Governance config:`, gov_config);
// console.log(`Reward allocation:`, reward_alloc);

// // const not_delegating = await queryNotDelegatingVotingPower(api);
// // console.log(`Not delegating voting power:`, not_delegating);

const proposals = await api.query.governanceModule.proposals.entries();

for (const [key, value] of proposals) {
  const proposal = value.unwrap();
  const parsed = PROPOSAL_SCHEMA.parse(proposal);

  match(parsed.status)({
    Open: (status) => {
      console.log(status);
    },
    Accepted: (status) => {
      console.log(status);
    },
    Refused: (status) => {
      console.log(status);
    },
    Expired: (status) => {
      console.log(status);
    },
  });
}

// const proposal_data_raw = proposal.data;

debugger;

process.exit(0);
