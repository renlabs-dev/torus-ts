import { z } from "zod";

import {
  sb_address,
  sb_amount,
  sb_block_number,
  sb_percentage,
  sb_u32,
  sb_u64,
} from "./common.js";

// Proposal data variants - based on PalletGovernanceProposalProposalData
export const PROPOSAL_DATA_SCHEMA = z.union([
  z.object({
    GlobalParams: z.record(z.unknown()),
  }),
  z.object({
    GlobalCustom: z.null(),
  }),
  z.object({
    TransferDaoTreasury: z.object({
      account: sb_address,
      amount: sb_amount,
    }),
  }),
  z.object({
    Emission: z.object({
      recyclingPercentage: sb_percentage,
      treasuryPercentage: sb_percentage,
      incentivesRatio: sb_percentage,
    }),
  }),
]);

// Proposal status variants - based on PalletGovernanceProposalProposalStatus
export const PROPOSAL_STATUS_SCHEMA = z.union([
  z.object({
    Open: z.object({
      votesFor: z.array(sb_address),
      votesAgainst: z.array(sb_address),
      stakeFor: sb_amount,
      stakeAgainst: sb_amount,
    }),
  }),
  z.object({
    Accepted: z.object({
      block: sb_block_number,
      stakeFor: sb_amount,
      stakeAgainst: sb_amount,
    }),
  }),
  z.object({
    Refused: z.object({
      block: sb_block_number,
      stakeFor: sb_amount,
      stakeAgainst: sb_amount,
    }),
  }),
  z.object({
    Expired: z.null(),
  }),
]);

// Full proposal schema - based on PalletGovernanceProposal
export const PROPOSAL_SCHEMA = z.object({
  id: sb_u64,
  proposer: sb_address,
  expirationBlock: sb_block_number,
  data: PROPOSAL_DATA_SCHEMA,
  status: PROPOSAL_STATUS_SCHEMA,
  metadata: z.string(),
  proposalCost: sb_amount,
  creationBlock: sb_block_number,
});

// Agent application status - based on PalletGovernanceApplicationApplicationStatus
export const APPLICATION_STATUS_SCHEMA = z.union([
  z.object({
    Open: z.null(),
  }),
  z.object({
    Resolved: z.object({
      accepted: z.boolean(),
    }),
  }),
  z.object({
    Expired: z.null(),
  }),
]);

// Agent application schema - based on PalletGovernanceApplicationAgentApplication
export const AGENT_APPLICATION_SCHEMA = z.object({
  id: sb_u32,
  payerKey: sb_address,
  agentKey: sb_address,
  data: z.string(),
  cost: sb_amount,
  expiresAt: sb_block_number,
  status: APPLICATION_STATUS_SCHEMA,
});

// Governance configuration - based on PalletGovernanceConfigGovernanceConfiguration
export const GOVERNANCE_CONFIG_SCHEMA = z.object({
  proposalCost: sb_amount,
  proposalExpiration: sb_block_number,
  agentApplicationCost: sb_amount,
  agentApplicationExpiration: sb_block_number,
  proposalRewardTreasuryAllocation: sb_percentage,
  maxProposalRewardTreasuryAllocation: sb_amount,
  proposalRewardInterval: sb_block_number,
});

export { sb_address, sb_percentage, sb_u32, sb_u64 };
