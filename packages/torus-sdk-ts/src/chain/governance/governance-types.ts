import type { ApiPromise } from "@polkadot/api";
import type { Bytes } from "@polkadot/types";
import type { Percent } from "@polkadot/types/interfaces";
import type { AnyNumber } from "@polkadot/types/types";
import { z } from "zod";

import type { SS58Address } from "../../types/address.js";
import {
  sb_address,
  sb_amount,
  sb_array,
  sb_bigint,
  sb_blocks,
  sb_bool,
  sb_enum,
  sb_id,
  sb_null,
  sb_percent,
  sb_string,
  sb_struct,
  sb_to_primitive,
} from "../../types/index.js";

export type GovernanceItemType = "PROPOSAL" | "AGENT_APPLICATION";

// ==== Proposals ====

/** Based on `PalletGovernanceProposalProposalData` */
export const PROPOSAL_DATA_SCHEMA = sb_enum({
  GlobalParams: sb_to_primitive.pipe(z.record(z.unknown())),
  GlobalCustom: sb_null,
  TransferDaoTreasury: sb_struct({
    account: sb_address,
    amount: sb_bigint,
  }),
  Emission: sb_struct({
    recyclingPercentage: sb_percent,
    treasuryPercentage: sb_percent,
    incentivesRatio: sb_percent,
  }),
});

export type ProposalData = z.infer<typeof PROPOSAL_DATA_SCHEMA>;

/** Based on `PalletGovernanceProposalProposalStatus` */
export const PROPOSAL_STATUS_SCHEMA = sb_enum({
  Open: sb_struct({
    votesFor: sb_array(sb_address),
    votesAgainst: sb_array(sb_address),
    stakeFor: sb_bigint,
    stakeAgainst: sb_bigint,
  }),
  Accepted: sb_struct({
    block: sb_bigint,
    stakeFor: sb_bigint,
    stakeAgainst: sb_bigint,
  }),
  Refused: sb_struct({
    block: sb_bigint,
    stakeFor: sb_bigint,
    stakeAgainst: sb_bigint,
  }),
  Expired: sb_null,
});

export type ProposalStatus = z.infer<typeof PROPOSAL_STATUS_SCHEMA>;

/** Based on `PalletGovernanceProposal` */
export const PROPOSAL_SCHEMA = sb_struct({
  id: sb_id,
  proposer: sb_address,
  expirationBlock: sb_blocks,
  data: PROPOSAL_DATA_SCHEMA,
  status: PROPOSAL_STATUS_SCHEMA,
  metadata: sb_string,
  proposalCost: sb_bigint,
  creationBlock: sb_blocks,
});

export type Proposal = z.infer<typeof PROPOSAL_SCHEMA>;

// -- Votes --

export interface VoteWithStake {
  address: SS58Address;
  stake: bigint;
  vote: "IN_FAVOR" | "AGAINST";
}

// == Applications ==

/** Based on `PalletGovernanceApplicationApplicationStatus` */
export const AGENT_APPLICATION_STATUS_SCHEMA = sb_enum({
  Open: sb_null,
  Resolved: sb_struct({ accepted: sb_bool }),
  Expired: sb_null,
});

export type ApplicationStatus = z.infer<typeof AGENT_APPLICATION_STATUS_SCHEMA>;

/** Based on `PalletGovernanceApplicationAgentApplication` */
export const AGENT_APPLICATION_SCHEMA = sb_struct({
  id: sb_id,
  payerKey: sb_address,
  agentKey: sb_address,
  data: sb_string,
  cost: sb_amount,
  expiresAt: sb_blocks,
  status: AGENT_APPLICATION_STATUS_SCHEMA,
});

export type AgentApplication = z.infer<typeof AGENT_APPLICATION_SCHEMA>;

// ==== Dao Treasury ====

export type DaoTreasuryAddress = z.infer<typeof sb_address>;

// == Governance Configuration ==

/** Based on `PalletGovernanceConfigGovernanceConfiguration` */
export const GOVERNANCE_CONFIGURATION_SCHEMA = sb_struct({
  proposalCost: sb_bigint,
  proposalExpiration: sb_bigint,
  agentApplicationCost: sb_bigint,
  agentApplicationExpiration: sb_bigint,
  proposalRewardTreasuryAllocation: sb_bigint,
  maxProposalRewardTreasuryAllocation: sb_bigint,
  proposalRewardInterval: sb_bigint,
});

export type GovernanceConfiguration = z.infer<
  typeof GOVERNANCE_CONFIGURATION_SCHEMA
>;

// ==== Transaction Interfaces ====

export interface EmissionProposal {
  api: ApiPromise;
  recyclingPercentage: Percent | AnyNumber | Uint8Array;
  treasuryPercentage: Percent | AnyNumber | Uint8Array;
  incentivesRatio: Percent | AnyNumber | Uint8Array;
  data: Bytes | string | Uint8Array;
}
