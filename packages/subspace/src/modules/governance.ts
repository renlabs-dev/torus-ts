import { Keyring } from "@polkadot/api";
import { encodeAddress } from "@polkadot/util-crypto";
import { z } from "zod";

import "@polkadot/api/augment";

import type { ApiPromise } from "@polkadot/api";

import type { SS58Address } from "../address";
import type { Api } from "./_common";
import { queryCachedStakeFrom, queryCachedStakeOut } from "../cached-queries";
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
  sb_some,
  sb_string,
  sb_struct,
  sb_to_primitive,
} from "../types";
import { handleMapValues } from "./_common";
import { queryFreeBalance } from "./subspace";
import type { Percent } from "@polkadot/types/interfaces";

const ADDRESS_FORMAT = 42;

export type GovernanceItemType = "PROPOSAL" | "AGENT_APPLICATION";

// == Proposals ==

/** Based on `PalletGovernanceProposalProposalData` */
export const PROPOSAL_DATA_SCHEMA = sb_enum({
  GlobalParams: sb_to_primitive.pipe(z.record(z.unknown())),
  GlobalCustom: sb_null,
  TransferDaoTreasury: sb_struct({
    account: sb_address,
    amount: sb_bigint,
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

export async function queryProposals(api: Api): Promise<Proposal[]> {
  const query = await api.query.governance.proposals.entries();
  const [proposals, errs] = handleMapValues(query, sb_some(PROPOSAL_SCHEMA));
  for (const err of errs) {
    // TODO: refactor out
    console.error(err);
  }
  return proposals;
}

// TODO: Refactor
export async function queryUnrewardedProposals(api: Api): Promise<number[]> {
  const unrewardedProposals =
    await api.query.governance.unrewardedProposals.entries();

  return unrewardedProposals
    .map(([key]) =>
      // The key is a StorageKey, which contains the proposal ID
      // We need to extract the proposal ID from this key and convert it to a number
      sb_id.parse(key.args[0]),
    )
    .filter((id) => !isNaN(id));
}

// -- Votes --

export interface VoteWithStake {
  address: SS58Address;
  stake: bigint;
  vote: "IN_FAVOR" | "AGAINST";
}

export async function processVotesAndStakes(
  api: Api,
  torusCacheUrl: string,
  votesFor: SS58Address[],
  votesAgainst: SS58Address[],
): Promise<VoteWithStake[]> {
  // Get addresses not delegating voting power and get stake information
  const [notDelegatingAddresses, stakeFrom, stakeOut] = await Promise.all([
    queryAccountsNotDelegatingVotingPower(api),
    queryCachedStakeFrom(torusCacheUrl),
    queryCachedStakeOut(torusCacheUrl),
  ]);

  const notDelegatingSet = new Set(notDelegatingAddresses);

  const stakeOutMap = new Map(
    Object.entries(stakeOut.perAddr).map(([key, value]) => [
      key,
      BigInt(value),
    ]),
  );

  const stakeFromMap = new Map(
    Object.entries(stakeFrom.perAddr).map(([key, value]) => [
      key,
      BigInt(value),
    ]),
  );

  // Pre-calculate total stake for each address
  const totalStakeMap = new Map<SS58Address, bigint>();
  const allAddresses = new Set([...votesFor, ...votesAgainst]);

  for (const address of allAddresses) {
    const stakeFrom = stakeFromMap.get(address) ?? 0n;
    const stakeOut = stakeOutMap.get(address) ?? 0n;

    const totalStake =
      stakeOut > 0n && !notDelegatingSet.has(address)
        ? 0n
        : stakeFrom + stakeOut;
    totalStakeMap.set(address, totalStake);
  }

  // Process all votes and push it to an array to avoid spread
  const processedVotes: VoteWithStake[] = [];
  votesFor.map((address) => {
    processedVotes.push({
      address,
      stake: totalStakeMap.get(address) ?? 0n,
      vote: "IN_FAVOR" as const,
    });
  });

  votesAgainst.map((address) => {
    processedVotes.push({
      address,
      stake: totalStakeMap.get(address) ?? 0n,
      vote: "AGAINST" as const,
    });
  });

  // Sort the processed votes
  const sortedVotes = processedVotes.sort((a, b) => Number(b.stake - a.stake));
  return sortedVotes;
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

export async function queryAgentApplications(
  api: Api,
): Promise<AgentApplication[]> {
  const query = await api.query.governance.agentApplications.entries();

  const [daos, errs] = handleMapValues(
    query,
    sb_some(AGENT_APPLICATION_SCHEMA),
  );
  for (const err of errs) {
    // TODO: refactor out
    console.error(err);
  }

  return daos;
}

// == Dao Treasury ==

export type DaoTreasuryAddress = z.infer<typeof sb_address>;

export async function queryDaoTreasuryAddress(
  api: Api,
): Promise<DaoTreasuryAddress> {
  const addr = await api.query.governance.daoTreasuryAddress();
  return sb_address.parse(addr);
}

export async function queryAccountsNotDelegatingVotingPower(
  api: Api,
): Promise<SS58Address[]> {
  const value = await api.query.governance.notDelegatingVotingPower();
  return sb_array(sb_address).parse(value);
}

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

type GovernanceConfiguration = z.infer<typeof GOVERNANCE_CONFIGURATION_SCHEMA>;

export async function queryGlobalGovernanceConfig(
  api: Api,
): Promise<GovernanceConfiguration> {
  const config = await api.query.governance.globalGovernanceConfig();
  const parsed_config = GOVERNANCE_CONFIGURATION_SCHEMA.parse(config);
  return parsed_config;
}

export async function queryTreasuryEmissionFee(api: Api): Promise<Percent> {
  const treasuryEmissionFee = await api.query.governance.treasuryEmissionFee();
  return treasuryEmissionFee;
}

export function getRewardAllocation(
  governanceConfig: GovernanceConfiguration,
  treasuryBalance: bigint,
) {
  const allocationPercentage =
    governanceConfig.proposalRewardTreasuryAllocation;
  const maxAllocation = governanceConfig.maxProposalRewardTreasuryAllocation;

  let allocation = (treasuryBalance * allocationPercentage) / 100n;

  if (allocation > maxAllocation) allocation = maxAllocation;

  // Here there is a "decay" calculation for the n-th proposal reward that
  // we are ignoring, as we want only the first.

  return allocation;
}

export async function queryRewardAllocation(api: Api): Promise<bigint> {
  const treasuryAddress = await queryDaoTreasuryAddress(api);
  const balance = await queryFreeBalance(api, treasuryAddress);
  const governanceConfig = await queryGlobalGovernanceConfig(api);
  return getRewardAllocation(governanceConfig, balance);
}

// == Whitelist ==

export async function pushToWhitelist(
  api: ApiPromise,
  moduleKey: SS58Address,
  mnemonic: string | undefined,
) {
  const keyring = new Keyring({ type: "sr25519" });

  if (!mnemonic) {
    throw new Error("No sudo mnemonic provided");
  }
  const sudoKeypair = keyring.addFromUri(mnemonic);
  const accountId = encodeAddress(moduleKey, ADDRESS_FORMAT);

  const tx = api.tx.governance.addToWhitelist(accountId);

  const extrinsic = await tx
    .signAndSend(sudoKeypair)
    .catch((err) => {
      console.error(err);
      return false;
    })
    .then(() => {
      console.log(`Extrinsic: ${extrinsic}`);
      return true;
    });
}

export async function queryWhitelist(api: Api): Promise<SS58Address[]> {
  const whitelist: SS58Address[] = [];

  const entries = await api.query.governance.whitelist.entries();
  for (const [keys, _value] of entries) {
    const address = sb_address.parse(keys.args[0]);
    whitelist.push(address);
  }

  return whitelist;
}

export async function removeFromWhitelist(
  api: ApiPromise,
  moduleKey: SS58Address,
  mnemonic: string | undefined,
) {
  if (!mnemonic) {
    throw new Error("No sudo mnemonic provided");
  }

  const accountId = encodeAddress(moduleKey, ADDRESS_FORMAT);
  const tx = api.tx.governance.removeFromWhitelist(accountId);

  const keyring = new Keyring({ type: "sr25519" });
  const sudoKeypair = keyring.addFromUri(mnemonic);
  const extrinsic = await tx.signAndSend(sudoKeypair);
  return extrinsic;
}

// TODO: receive key instead of mnemonic
export async function acceptApplication(
  api: ApiPromise,
  proposalId: number,
  mnemonic: string,
) {
  if (!mnemonic) {
    throw new Error("No sudo mnemonic provided to accept application");
  }

  const tx = api.tx.governance.acceptApplication(proposalId);

  const keyring = new Keyring({ type: "sr25519" });
  const sudoKeypair = keyring.addFromUri(mnemonic);
  const extrinsic = await tx.signAndSend(sudoKeypair);
  return extrinsic;
}

export async function penalizeAgent(
  api: ApiPromise,
  agentKey: string,
  penaltyFactor: number,
  mnemonic: string,
) {
  if (!mnemonic) {
    throw new Error("No sudo mnemonic provided to penalize agent");
  }

  const tx = api.tx.governance.penalizeAgent(agentKey, penaltyFactor);

  const keyring = new Keyring({ type: "sr25519" });
  const sudoKeypair = keyring.addFromUri(mnemonic);
  const extrinsic = await tx.signAndSend(sudoKeypair);
  return extrinsic;
}

export async function denyApplication(
  api: ApiPromise,
  proposalId: number,
  mnemonic: string | undefined,
) {
  if (!mnemonic) {
    throw new Error("No sudo mnemonic provided");
  }

  const tx = api.tx.governance.denyApplication(proposalId);

  const keyring = new Keyring({ type: "sr25519" });
  const sudoKeypair = keyring.addFromUri(mnemonic);
  const extrinsic = await tx.signAndSend(sudoKeypair);
  return extrinsic;
}
