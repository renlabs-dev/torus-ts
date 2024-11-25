import type { StorageKey } from "@polkadot/types";
import type { Codec } from "@polkadot/types/types";
import type { ZodType, ZodTypeDef } from "zod";
import { z } from "zod";

import { check_error } from "@torus-ts/utils";

import type { Api } from "../old_types";
import {
  sb_address,
  sb_array,
  sb_bigint,
  sb_enum,
  sb_null,
  sb_some,
  sb_string,
  sb_struct,
} from "../types";

// == Proposals ==

export const PROPOSAL_DATA_SCHEMA = sb_enum({
  GlobalCustom: sb_null,
  GlobalParams: z.unknown(),
  SubnetCustom: sb_struct({ subnetId: sb_bigint }),
  SubnetParams: sb_struct({
    subnetId: sb_bigint,
    params: z.unknown(),
  }),
  TransferDaoTreasury: sb_struct({
    account: sb_address,
    amount: sb_bigint,
  }),
});

export type ProposalData = z.infer<typeof PROPOSAL_DATA_SCHEMA>;

export const PROPOSAL_STATUS_SCHEMA = sb_enum({
  Open: sb_struct({
    votes_for: sb_array(sb_address),
    votes_against: sb_array(sb_address),
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

export const PROPOSAL_SCHEMA = sb_struct({
  id: sb_bigint,
  proposer: sb_address,
  expirationBlock: sb_bigint,
  data: PROPOSAL_DATA_SCHEMA,
  status: PROPOSAL_STATUS_SCHEMA,
  metadata: sb_string,
  proposalCost: sb_bigint,
  creationBlock: sb_bigint,
});

export type Proposal = z.infer<typeof PROPOSAL_SCHEMA>;

export type SbMapEntries<K extends Codec> = [StorageKey<[K]>, Codec][];
export type SbDoubleMapEntries<K1 extends Codec, K2 extends Codec> = [
  StorageKey<[K1, K2]>,
  Codec,
];

export async function queryProposals(api: Api) {
  const proposalsQuery = await api.query.governanceModule.proposals.entries();
  const [proposals, proposalsErrs] = handleProposals(proposalsQuery);
  for (const err of proposalsErrs) {
    console.error(err);
  }
  return proposals;
}

export function handleProposals<K extends Codec>(
  rawProposals: [K, Codec][],
): [Proposal[], Error[]] {
  return handleMapEntries(rawProposals, sb_some(PROPOSAL_SCHEMA));
}

export function handleMapEntries<
  K extends Codec,
  T,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  S extends ZodType<T, ZodTypeDef, any>,
>(rawEntries: [K, Codec][], schema: S): [T[], Error[]] {
  const entries: T[] = [];
  const errors: Error[] = [];
  for (const entry of rawEntries) {
    const [, valueRaw] = entry;

    try {
      var parsed = schema.parse(valueRaw);
    } catch (err) {
      check_error(err);
      errors.push(err);
      continue;
    }

    if (parsed == null) {
      errors.push(new Error(`Invalid entry: ${entry.toString()}`));
      continue;
    }
    entries.push(parsed);
  }
  entries.reverse();
  return [entries, errors];
}
