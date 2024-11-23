import type { ApiPromise } from "@polkadot/api";
import type { ApiDecoration } from "@polkadot/api/types";
import type { Header } from "@polkadot/types/interfaces";
import type { IU8a } from "@polkadot/types/types";
import type { Extends } from "tsafe";
import { assert } from "tsafe";
import { z } from "zod";

import type { Result } from "@torus-ts/utils";

import type { SS58Address } from "./address";
import { SS58_SCHEMA } from "./address";

export type {
  InjectedAccountWithMeta,
  InjectedExtension,
} from "@polkadot/extension-inject/types";

export type { ApiPromise } from "@polkadot/api";
export type { StorageKey } from "@polkadot/types";

export type { AnyTuple, Codec } from "@polkadot/types/types";

export type GovernanceModeType = "PROPOSAL" | "DAO";

export type Api = ApiDecoration<"promise"> | ApiPromise;

// == Base Types ==

export interface BaseProposal {
  id: number;
  metadata: string;
}

export interface BaseDao {
  id: number;
  data: string;
}

// == Custom Metadata ==

export const CUSTOM_METADATA_SCHEMA = z.object({
  title: z.string().optional(),
  body: z.string().optional(),
});

export type CustomMetadata = z.infer<typeof CUSTOM_METADATA_SCHEMA>;

export const DAO_METADATA_SCHEMA = z.object({
  title: z.string(),
  body: z.string(),
  discord_id: z.string(),
});

export type CustomDaoMetadata = z.infer<typeof DAO_METADATA_SCHEMA>;

export interface CustomDataError {
  message: string;
}

export function isCustomDataError(obj: object): obj is CustomDataError {
  return (
    typeof obj === "object" &&
    "Err" in obj &&
    typeof obj.Err === "object" &&
    obj.Err !== null &&
    "message" in obj.Err
  );
}

export type CustomMetadataState = Result<CustomMetadata, CustomDataError>;

export type WithMetadataState<T> = T & { customData?: CustomMetadataState };

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
  blockNumber: number;
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

export const TOKEN_AMOUNT_SCHEMA = z
  .string()
  .or(z.number())
  .transform((value) => BigInt(value));

export enum DaoApplicationVote {
  FAVORABLE = "FAVORABLE",
  AGAINST = "AGAINST",
  REFUSE = "REFUSE",
}

export type DaoApplicationStatus =
  | "Accepted"
  | "Refused"
  | "Pending"
  | "Removed";

export const DAO_APPLICATIONS_SCHEMA = z.object({
  id: z.number(),
  userId: SS58_SCHEMA,
  payingFor: SS58_SCHEMA,
  data: z.string(),
  blockNumber: z.number(),
  status: z
    .string()
    .refine(
      (value) => ["Pending", "Accepted", "Refused", "Removed"].includes(value),
      "Invalid DAO status format",
    )
    .transform((value) => value as DaoApplicationStatus),
  applicationCost: TOKEN_AMOUNT_SCHEMA,
});

export type DaoApplications = z.infer<typeof DAO_APPLICATIONS_SCHEMA>;

export interface DAOCardFields {
  title: string | null;
  body: string | null;
}

export type DaoState = WithMetadataState<DaoApplications>;

// == Proposals ==

export const PROPOSAL_STATUS_SCHEMA = z.union([
  z.object({
    open: z.object({
      votesFor: z.array(SS58_SCHEMA),
      votesAgainst: z.array(SS58_SCHEMA),
      stakeFor: TOKEN_AMOUNT_SCHEMA,
      stakeAgainst: TOKEN_AMOUNT_SCHEMA,
    }),
  }),
  z.object({
    accepted: z.object({
      block: z.number(),
      stakeFor: TOKEN_AMOUNT_SCHEMA,
      stakeAgainst: TOKEN_AMOUNT_SCHEMA,
    }),
  }),
  z.object({
    refused: z.object({
      block: z.number(),
      stakeFor: TOKEN_AMOUNT_SCHEMA,
      stakeAgainst: TOKEN_AMOUNT_SCHEMA,
    }),
  }),
  z.object({
    expired: z.null(),
  }),
]);

export const PROPOSAL_DATA_SCHEMA = z.union([
  z.object({ globalCustom: z.null() }),
  z.object({ globalParams: z.record(z.unknown()) }),
  z.object({ subnetCustom: z.object({ subnetId: z.number() }) }),
  z.object({
    subnetParams: z.object({
      subnetId: z.number(),
      params: z.record(z.unknown()),
    }),
  }),
  z.object({
    transferDaoTreasury: z.object({
      account: SS58_SCHEMA,
      amount: TOKEN_AMOUNT_SCHEMA,
    }),
  }),
]);

export const PROPOSAL_SCHEMA = z.object({
  id: z.number(),
  proposer: SS58_SCHEMA,
  expirationBlock: z.number(),
  data: PROPOSAL_DATA_SCHEMA,
  status: PROPOSAL_STATUS_SCHEMA,
  metadata: z.string(),
  proposalCost: TOKEN_AMOUNT_SCHEMA,
  creationBlock: z.number(),
});

export type ProposalStatus = z.infer<typeof PROPOSAL_STATUS_SCHEMA>;
export type ProposalData = z.infer<typeof PROPOSAL_DATA_SCHEMA>;

export interface Proposal {
  id: number;
  proposer: SS58Address;
  expirationBlock: number;
  data: ProposalData;
  status: ProposalStatus;
  metadata: string;
  proposalCost: bigint;
  creationBlock: number;
}

assert<Extends<Proposal, z.infer<typeof PROPOSAL_SCHEMA>>>();
assert<Extends<z.infer<typeof PROPOSAL_SCHEMA>, Proposal>>();

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

export const SUBSPACE_MODULE_NAME_SCHEMA = z.string();
export const SUBSPACE_MODULE_ADDRESS_SCHEMA = z.string();
export const NUMBER_SCHEMA = z.coerce.number();
export const SUBSPACE_MODULE_REGISTRATION_BLOCK_SCHEMA = z.coerce.number();
export const SUBSPACE_MODULE_METADATA_SCHEMA = z.string(); // TODO: validate it's a valid ipfs hash or something (?)
export const SUBSPACE_MODULE_LAST_UPDATE_SCHEMA = z.any();
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

export const SUBSPACE_MODULE_SCHEMA = z.object({
  netuid: z.coerce.number(),
  key: SS58_SCHEMA,
  uid: z.coerce.number().int(),
  name: SUBSPACE_MODULE_NAME_SCHEMA.optional(),
  address: SUBSPACE_MODULE_ADDRESS_SCHEMA.optional(),
  registrationBlock: SUBSPACE_MODULE_REGISTRATION_BLOCK_SCHEMA.optional(),
  metadata: SUBSPACE_MODULE_METADATA_SCHEMA.optional(),
  lastUpdate: SUBSPACE_MODULE_LAST_UPDATE_SCHEMA.optional(),
  atBlock: z.coerce.number().optional(),

  emission: z.coerce.bigint().optional(),
  incentive: z.coerce.bigint().optional(),
  dividends: z.coerce.bigint().optional(),
  delegationFee: z.coerce.number().optional(),

  totalStaked: z.coerce.bigint(),
  totalStakers: z.coerce.number(),
});

export type SubspaceModule = z.infer<typeof SUBSPACE_MODULE_SCHEMA>;

// == Other ==

export const QUERY_PARAMS_SCHEMA = z.object({
  netuid: z.number(),
  address: SS58_SCHEMA,
});
