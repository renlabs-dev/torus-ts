import type { ApiPromise } from "@polkadot/api";
import type { ApiDecoration } from "@polkadot/api/types";
import type { Header } from "@polkadot/types/interfaces";
import type { IU8a } from "@polkadot/types/types";
import { z } from "zod";

import type { Result } from "@torus-ts/utils";

import type { SS58Address } from "./address";
import type { DaoApplications, Proposal } from "./modules/governance";
import type { Blocks } from "./types";
import { SS58_SCHEMA } from "./address";

export * from "./modules/governance";

export type {
  InjectedAccountWithMeta,
  InjectedExtension,
} from "@polkadot/extension-inject/types";

export type { ApiPromise } from "@polkadot/api";
export type { StorageKey } from "@polkadot/types";

export type { AnyTuple, Codec } from "@polkadot/types/types";

export type Api = ApiDecoration<"promise"> | ApiPromise;

// == Base Types ==

// == Custom Metadata ==

// == Stake ==

export interface StakeData {
  total: bigint;
  perAddr: Record<string, bigint>;
  atBlock: bigint;
  atTime: Date;
}

export type StakeOutData = StakeData;

export type StakeFromData = StakeData;

export const STAKE_DATA_SCHEMA = z.object({
  total: z.coerce.bigint(),
  perAddr: z.record(z.string(), z.coerce.bigint()),
  atBlock: z.coerce.bigint(),
  atTime: z.coerce.date(),
});

export interface VoteWithStake {
  address: SS58Address;
  stake: bigint;
  vote: "In Favor" | "Against";
}

export interface LastBlock {
  blockHeader: Header;
  blockNumber: Blocks;
  blockHash: IU8a;
  blockHashHex: `0x${string}`;
  apiAtBlock: ApiDecoration<"promise">;
}

export interface ProposalStakeInfo {
  stakeFor: bigint;
  stakeAgainst: bigint;
  stakeVoted: bigint;
  stakeTotal: bigint;
}

// == DAO Applications ==

export interface DAOCardFields {
  title: string | null;
  body: string | null;
}

export type DaoState = WithMetadataState<DaoApplications>;

// == Proposals ==

export type ProposalState = WithMetadataState<Proposal>;

export interface ProposalCardFields {
  title: string | null;
  body: string | null;
  netuid: number | "GLOBAL";
  invalid?: boolean;
}

export interface UnrewardedProposal {
  subnetId: number;
  block: bigint;
  votesFor: Map<SS58Address, bigint>;
  votesAgainst: Map<SS58Address, bigint>;
}

// == Field Params ==

export const GOVERNANCE_CONFIG_SCHEMA = z.object({
  proposalCost: z.coerce.bigint(),
  voteMode: z.string(),
  maxProposalRewardTreasuryAllocation: z.coerce.bigint(),
  proposalRewardInterval: z.coerce.number().int(),
  proposalRewardTreasuryAllocation: z.coerce.number(),
  proposalExpiration: z.coerce.number().int(),
});

export const MODULE_BURN_CONFIG_SCHEMA = z.object({
  minBurn: z.coerce.bigint(),
  maxBurn: z.coerce.bigint(),
  adjustmentAlpha: z.coerce.string(),
  targetRegistrationsInterval: z.coerce.number().int(),
  targetRegistrationsPerInterval: z.coerce.number().int(),
  maxRegistrationsPerInterval: z.coerce.number().int(),
});

export const NetworkSubnetConfigSchema = z.object({
  netuid: z.coerce.number().int(),
  subnetNames: z.string(),
  immunityPeriod: z.coerce.number().int(),
  minAllowedWeights: z.coerce.number().int(),
  maxAllowedWeights: z.coerce.number().int(),
  tempo: z.coerce.number().int(),
  maxAllowedUids: z.coerce.number().int(),
  founder: z.string(),
  founderShare: z.coerce.number(),
  incentiveRatio: z.coerce.number().int(),
  trustRatio: z.coerce.number().int(),
  maxWeightAge: z.coerce.string(),
  bondsMovingAverage: z.coerce.number().int().optional(),
  maximumSetWeightCallsPerEpoch: z.coerce.number().int().optional(),
  minValidatorStake: z.coerce.bigint(),
  maxAllowedValidators: z.coerce.number().int().optional(),
  moduleBurnConfig: MODULE_BURN_CONFIG_SCHEMA,
  subnetGovernanceConfig: GOVERNANCE_CONFIG_SCHEMA,
  subnetEmission: z.coerce.bigint(),
  subnetMetadata: z.string().optional(),
});

export type NetworkSubnetConfig = z.infer<typeof NetworkSubnetConfigSchema>;

export const STAKE_FROM_SCHEMA = z.object({
  stakeFromStorage: z
    .record(SS58_SCHEMA, z.record(SS58_SCHEMA, z.coerce.bigint()))
    .transform((val) => {
      const map = new Map<SS58Address, Map<SS58Address, bigint>>();
      const stakeMapEntries = Object.entries(val) as [
        SS58Address,
        Record<SS58Address, bigint>,
      ][];
      for (const [stakedInto, stakerMap] of stakeMapEntries) {
        const innerMap = new Map<SS58Address, bigint>();
        const stakers = Object.entries(stakerMap) as [SS58Address, bigint][];
        for (const [staker, stake] of stakers) {
          innerMap.set(staker, BigInt(stake));
        }
        map.set(stakedInto, innerMap);
      }
      return map;
    }),
});
