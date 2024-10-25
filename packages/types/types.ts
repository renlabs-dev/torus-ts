import type { ApiPromise } from "@polkadot/api";
import type { ApiDecoration } from "@polkadot/api/types";
import type { Header } from "@polkadot/types/interfaces";
import type { Codec, IU8a } from "@polkadot/types/types";
import type { Enum, Tagged } from "rustie";
import type { Variant } from "rustie/dist/enum";
import { z } from "zod";


import type {
  CUSTOM_METADATA_SCHEMA,
  DAO_APPLICATIONS_SCHEMA,
  DAO_METADATA_SCHEMA,
  PROPOSAL_DATA_SCHEMA,
  PROPOSAL_STATUS_SCHEMA,
  SUBSPACE_MODULE_SCHEMA,
} from "./validations";

export { ZodSchema } from "zod";

export type {
  InjectedAccountWithMeta,
  InjectedExtension,
} from "@polkadot/extension-inject/types";

export type { ApiPromise } from "@polkadot/api";
export type { StorageKey } from "@polkadot/types";

export type { AnyTuple, Codec } from "@polkadot/types/types";

export type Entry<T> = [unknown, T];
export type RawEntry = Entry<Codec>[] | undefined;
export type Result<T, E> = Enum<{ Ok: T; Err: E }>;
export type GovernanceModeType = "PROPOSAL" | "DAO";

export type Nullish = null | undefined;
export type Api = ApiDecoration<"promise"> | ApiPromise;

// ==== Rustie related ====

type KeysOfUnion<T> = T extends T ? keyof T : never;

type ValueOfUnion<T, K extends KeysOfUnion<T>> = Extract<
  T,
  Record<K, unknown>
>[K];

export type UnionToVariants<T> =
  KeysOfUnion<T> extends infer K
    ? K extends KeysOfUnion<T>
      ? Variant<K, ValueOfUnion<T, K>>
      : never
    : never;

// ==========================

export interface BaseProposal {
  id: number;
  metadata: string;
}

export interface BaseDao {
  id: number;
  data: string;
}

export type CustomMetadata = z.infer<typeof CUSTOM_METADATA_SCHEMA>;
export type CustomDaoMetadata = z.infer<typeof DAO_METADATA_SCHEMA>;

export interface CustomDataError {
  message: string;
}

// TODO: see if this works
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

export interface StakeOutData {
  total: bigint;
  perAddr: Record<string, bigint>;
  atBlock: bigint;
  atTime: Date;
}

export const STAKE_OUT_DATA_SCHEMA = z.object({
  total: z.coerce.bigint(),
  perAddr: z.record(z.string(), z.coerce.bigint()),
  atBlock: z.coerce.bigint(),
  atTime: z.coerce.date(),
});

export interface StakeFromData {
  total: bigint;
  perAddr: Map<string, bigint>;
}

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

// == SS58 ==

export type SS58Address = Tagged<"SS58Address", string>;

// == Transactions ==

export interface TransactionResult {
  finalized: boolean;
  message: string | null;
  status: "SUCCESS" | "ERROR" | "PENDING" | "STARTING" | null;
}

export interface Stake {
  validator: string;
  amount: string;
  callback?: (status: TransactionResult) => void;
}

export interface Transfer {
  to: string;
  amount: string;
  callback?: (status: TransactionResult) => void;
}

export interface TransferStake {
  fromValidator: string;
  toValidator: string;
  amount: string;
  callback?: (status: TransactionResult) => void;
}

// == Governance ==

export interface Vote {
  proposalId: number;
  vote: boolean;
  callback?: (status: TransactionResult) => void;
}

export interface RemoveVote {
  proposalId: number;
  callback?: (status: TransactionResult) => void;
}

export interface RegisterModule {
  subnetName: string;
  address: string;
  name: string;
  moduleId: string;
  metadata: string;
  callback?: (status: TransactionResult) => void;
}

export interface AddCustomProposal {
  IpfsHash: string;
  callback?: (status: TransactionResult) => void;
}

export interface addTransferDaoTreasuryProposal {
  IpfsHash: string;
  value: string;
  dest: string;
  callback?: (status: TransactionResult) => void;
}

export interface AddDaoApplication {
  IpfsHash: string;
  applicationKey: string;
  callback?: (status: TransactionResult) => void;
}

export interface UpdateDelegatingVotingPower {
  isDelegating: boolean;
  callback?: (status: TransactionResult) => void;
}

// == DAO Applications ==

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

export type DaoApplications = z.infer<typeof DAO_APPLICATIONS_SCHEMA>;

export interface DAOCardFields {
  title: string | null;
  body: string | null;
}

export type DaoState = WithMetadataState<DaoApplications>;

// == Proposals ==

export type ProposalStatus = UnionToVariants<
  z.infer<typeof PROPOSAL_STATUS_SCHEMA>
>;

export type ProposalData = UnionToVariants<
  z.infer<typeof PROPOSAL_DATA_SCHEMA>
>;

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

export type NetworkSubnetConfig = z.infer<typeof NetworkSubnetConfigSchema>;
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

export type SubspaceModule = z.infer<typeof SUBSPACE_MODULE_SCHEMA>;

export type OptionalProperties<T> = keyof T extends infer K
  ? K extends keyof T
    ? T[K] extends infer U
      ? U extends undefined
        ? K
        : never
      : never
    : never
  : never;

// == Auth ==

export const AUTH_REQ_SCHEMA = z.object({
  statement: z.string(), // "Sign in with Polkadot extension to authenticate your session at ${uri}"
  uri: z.string(), // origin or "<unknown>"
  nonce: z.string(), // hex random number
  created: z.string().datetime(), // ISO date string
});

export type AuthReq = z.infer<typeof AUTH_REQ_SCHEMA>;

export const SIGNED_PAYLOAD_SCHEMA = z.object({
  payload: z.string({ description: "in hex" }),
  signature: z.string({ description: "in hex" }),
  address: z.string({ description: "in hex" }),
});

export type SignedPayload = z.infer<typeof SIGNED_PAYLOAD_SCHEMA>;
