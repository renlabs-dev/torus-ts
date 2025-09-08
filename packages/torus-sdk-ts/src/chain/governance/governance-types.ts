import type { ApiPromise } from "@polkadot/api";
import type { Bytes } from "@polkadot/types";
import type { Percent } from "@polkadot/types/interfaces";
import type { AnyNumber } from "@polkadot/types/types";
import type { z } from "zod";
import type { SS58Address } from "../../types/address.js";
import {
  sb_address,
  sb_array,
  sb_bigint,
  sb_blocks,
  sb_bool,
  sb_enum,
  sb_id,
  sb_null,
  sb_number_int,
  sb_percent,
  sb_string,
  sb_struct,
} from "../../types/index.js";

export type GovernanceItemType = "PROPOSAL" | "AGENT_APPLICATION";

// ==== Namespace Pricing Configuration ====

/**
 * Schema for NamespacePricingConfig with comprehensive validation.
 * 
 * Validates the logistic function parameters used to calculate namespace
 * registration fees based on the number of existing namespaces for an agent.
 * 
 * Based on `pallet_torus0::namespace::NamespacePricingConfig`
 */
export const NAMESPACE_PRICING_CONFIG_SCHEMA = sb_struct({
  /** Tokens held per byte inserted */
  depositPerByte: sb_bigint,
  /** Base fee for the logistic function calculation */
  baseFee: sb_bigint,
  /** The logistic function's midpoint (number of entries) */
  countMidpoint: sb_number_int.refine(
    (val) => val >= 0,
    "countMidpoint must be non-negative"
  ),
  /** How steep the pricing increase is (percentage 0-100) */
  feeSteepness: sb_percent,
  /** The maximum multiplier for the base fee */
  maxFeeMultiplier: sb_number_int.refine(
    (val) => val >= 0,
    "maxFeeMultiplier must be non-negative"
  ),
});

export type NamespacePricingConfig = z.infer<typeof NAMESPACE_PRICING_CONFIG_SCHEMA>;

// ==== Global Parameters ====

/**
 * Schema for GlobalParamsData with detailed validation.
 * 
 * Validates all global network parameters that can be modified through governance.
 * Includes business logic validation matching the Substrate pallet constraints.
 * 
 * Based on `pallet_governance::proposal::GlobalParamsData`
 */
export const GLOBAL_PARAMS_DATA_SCHEMA = sb_struct({
  /** Minimum allowed length for agent names (must be > 1) */
  minNameLength: sb_number_int.refine(
    (val) => val > 1,
    "minNameLength must be greater than 1"
  ),
  /** Maximum allowed length for agent names */
  maxNameLength: sb_number_int.refine(
    (val) => val > 0 && val < 256, // Using reasonable constraint since we don't have access to MaxAgentNameLengthConstraint
    "maxNameLength must be between 1 and 255"
  ),
  /** Minimum weight control fee percentage (0-100) */
  minWeightControlFee: sb_number_int.refine(
    (val) => val >= 0 && val <= 100,
    "minWeightControlFee must be between 0 and 100"
  ),
  /** Minimum staking fee percentage (0-100) */
  minStakingFee: sb_number_int.refine(
    (val) => val >= 0 && val <= 100,
    "minStakingFee must be between 0 and 100"
  ),
  /** Dividend participation weight percentage */
  dividendsParticipationWeight: sb_percent,
  /** Namespace pricing configuration */
  namespacePricingConfig: NAMESPACE_PRICING_CONFIG_SCHEMA,
  /** Cost to submit a governance proposal */
  proposalCost: sb_bigint.refine(
    (val) => val <= 50_000_000_000_000_000_000_000n,
    "proposalCost must not exceed 50,000 TORS (50,000,000,000,000,000,000,000 wei)"
  ),
}).refine(
  (data) => data.minNameLength <= data.maxNameLength,
  {
    message: "minNameLength must be less than or equal to maxNameLength",
    path: ["minNameLength"],
  }
);

export type GlobalParamsData = z.infer<typeof GLOBAL_PARAMS_DATA_SCHEMA>;

// ==== Proposals ====

/** Based on `PalletGovernanceProposalProposalData` */
export const PROPOSAL_DATA_SCHEMA = sb_enum({
  /** Global parameter changes with detailed validation */
  GlobalParams: GLOBAL_PARAMS_DATA_SCHEMA,
  /** Custom proposal with no immediate chain impact */
  GlobalCustom: sb_null,
  /** Transfer from DAO treasury to specified account */
  TransferDaoTreasury: sb_struct({
    account: sb_address,
    amount: sb_bigint,
  }),
  /** Emission parameter adjustments */
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
  cost: sb_bigint,
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
