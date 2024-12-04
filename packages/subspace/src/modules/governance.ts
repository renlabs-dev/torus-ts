import { z } from "zod";

import type { Api } from "../old_types";
import {
  sb_address,
  sb_amount,
  sb_array,
  sb_basic_enum,
  sb_bigint,
  sb_blocks,
  sb_enum,
  sb_id,
  sb_null,
  sb_some,
  sb_string,
  sb_struct,
  sb_to_primitive,
} from "../types";
import { handleMapValues } from "./_common";

// == Proposals ==

export const PROPOSAL_DATA_SCHEMA = sb_enum({
  GlobalCustom: sb_null,
  GlobalParams: sb_to_primitive.pipe(z.record(z.unknown())),
  SubnetCustom: sb_struct({ subnetId: sb_id }),
  SubnetParams: sb_struct({
    subnetId: sb_id,
    params: sb_to_primitive.pipe(z.record(z.unknown())),
  }),
  TransferDaoTreasury: sb_struct({
    account: sb_address,
    amount: sb_bigint,
  }),
});

export type ProposalData = z.infer<typeof PROPOSAL_DATA_SCHEMA>;

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

export async function queryProposals(api: Api): Promise<Proposal[]> {
  const query = await api.query.governanceModule.proposals.entries();
  const [proposals, errs] = handleMapValues(query, sb_some(PROPOSAL_SCHEMA));
  for (const err of errs) {
    // TODO: refactor out
    console.error(err);
  }
  return proposals;
}

// == Aplications ==

export const DAO_APPLICATION_STATUS_SCHEMA = sb_basic_enum([
  "Accepted",
  "Refused",
  "Pending",
  "Removed",
]);

export type DaoApplicationStatus = z.infer<
  typeof DAO_APPLICATION_STATUS_SCHEMA
>;

export const DAO_APPLICATIONS_SCHEMA = sb_struct({
  id: sb_id,
  userId: sb_address,
  payingFor: sb_address,
  data: sb_string,
  blockNumber: sb_blocks,
  status: DAO_APPLICATION_STATUS_SCHEMA,
  applicationCost: sb_amount,
});

export type DaoApplications = z.infer<typeof DAO_APPLICATIONS_SCHEMA>;

export async function queryDaoApplications(
  api: Api,
): Promise<DaoApplications[]> {
  const query = await api.query.governanceModule.curatorApplications.entries();

  const [daos, errs] = handleMapValues(query, sb_some(DAO_APPLICATIONS_SCHEMA));
  for (const err of errs) {
    // TODO: refactor out
    console.error(err);
  }

  return daos;
}
