import type { Extends } from "tsafe";
import { decodeAddress } from "@polkadot/util-crypto";
import { assert } from "tsafe";
import { z } from "zod";

import type {
  DaoApplicationStatus,
  Proposal,
  SS58Address,
} from "./types";

export function checkSS58(value: string | SS58Address): SS58Address {
  try {
    decodeAddress(value);
  } catch (err) {
    throw new Error(`Invalid SS58 address: ${value}`, { cause: err });
  }
  return value as SS58Address;
}

export function isSS58(value: string | null | undefined): value is SS58Address {
  try {
    decodeAddress(value);
  } catch (_e) {
    return false;
  }
  return true;
}

export const CUSTOM_METADATA_SCHEMA = z.object({
  title: z.string().optional(),
  body: z.string().optional(),
});

export const DAO_METADATA_SCHEMA = z.object({
  title: z.string(),
  body: z.string(),
  discord_id: z.string(),
});

export const URL_SCHEMA = z.string().trim().url();

export const ADDRESS_SCHEMA = z.string().refine(isSS58, "Invalid SS58 address");

// == Query params validation ==
export const QUERY_PARAMS_SCHEMA = z.object({
  netuid: z.number(),
  address: ADDRESS_SCHEMA,
});

// == Governance ==

export const TOKEN_AMOUNT_SCHEMA = z
  .string()
  .or(z.number())
  .transform((value) => BigInt(value));

// == DAO Applications ==
export const DAO_APPLICATIONS_SCHEMA = z.object({
  id: z.number(),
  userId: ADDRESS_SCHEMA,
  payingFor: ADDRESS_SCHEMA,
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

// == Proposals ==

export const PROPOSAL_STATUS_SCHEMA = z.union([
  z.object({
    open: z.object({
      votesFor: z.array(ADDRESS_SCHEMA),
      votesAgainst: z.array(ADDRESS_SCHEMA),
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
      account: ADDRESS_SCHEMA,
      amount: TOKEN_AMOUNT_SCHEMA,
    }),
  }),
]);

export const PROPOSAL_SCHEMA = z.object({
  id: z.number(),
  proposer: ADDRESS_SCHEMA,
  expirationBlock: z.number(),
  data: PROPOSAL_DATA_SCHEMA,
  status: PROPOSAL_STATUS_SCHEMA,
  metadata: z.string(),
  proposalCost: TOKEN_AMOUNT_SCHEMA,
  creationBlock: z.number(),
});

assert<Extends<Proposal, z.infer<typeof PROPOSAL_SCHEMA>>>();
assert<Extends<z.infer<typeof PROPOSAL_SCHEMA>, Proposal>>();

// == Field Params ==

export const SUBSPACE_MODULE_NAME_SCHEMA = z.string();
export const SUBSPACE_MODULE_ADDRESS_SCHEMA = z.string();
export const NUMBER_SCHEMA = z.coerce.number();
export const SUBSPACE_MODULE_REGISTRATION_BLOCK_SCHEMA = z.coerce.number();
export const SUBSPACE_MODULE_METADATA_SCHEMA = z.string(); // TODO: validate it's a valid ipfs hash or something (?)
export const SUBSPACE_MODULE_LAST_UPDATE_SCHEMA = z.any();
export const STAKE_FROM_SCHEMA = z.object({
  stakeFromStorage: z.record(
    ADDRESS_SCHEMA,
    z.record(ADDRESS_SCHEMA, z.coerce.bigint())
  ).transform(
    (val) => {
      const map = new Map<SS58Address, Map<SS58Address, bigint>>();
      const stakeMapEntries = Object.entries(val) as [SS58Address, Record<SS58Address, bigint>][];
      for (const [stakedInto, stakerMap] of stakeMapEntries) {
        const innerMap = new Map<SS58Address, bigint>();
        const stakers = Object.entries(stakerMap) as [SS58Address, bigint][];
        for (const [staker, stake] of stakers) {
          innerMap.set(staker, BigInt(stake));
        }
        map.set(stakedInto, innerMap);
      }
      return map;
    },
  ),
});

export const SUBSPACE_MODULE_SCHEMA = z.object({
  netuid: z.coerce.number(),
  key: ADDRESS_SCHEMA,
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
