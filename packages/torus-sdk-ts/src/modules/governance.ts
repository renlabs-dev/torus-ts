import { Keyring } from "@polkadot/api";
import { encodeAddress } from "@polkadot/util-crypto";
import { z } from "zod";
import "@polkadot/api/augment";
import type { ApiPromise } from "@polkadot/api";
import type { Percent } from "@polkadot/types/interfaces";
import type { SS58Address } from "../address";
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
  sb_percent,
  sb_some,
  sb_string,
  sb_struct,
  sb_to_primitive,
} from "../types";
import type { Api } from "./_common";
import { handleMapValues } from "./_common";
import { queryFreeBalance } from "./subspace";
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";

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

export async function queryProposals(api: Api): Promise<Proposal[]> {
  const [queryError, query] = await tryAsync(
    api.query.governance.proposals.entries(),
  );
  if (queryError !== undefined) {
    console.error("Error querying proposals:", queryError);
    throw queryError;
  }

  const [handlingError, result] = trySync(() =>
    handleMapValues(query, sb_some(PROPOSAL_SCHEMA)),
  );
  if (handlingError !== undefined) {
    console.error("Error handling map values for proposals:", handlingError);
    throw handlingError;
  }

  const [proposals, errs] = result;
  for (const err of errs) {
    console.error(err);
  }
  return proposals;
}

// TODO: Refactor
export async function queryUnrewardedProposals(api: Api): Promise<number[]> {
  const [queryError, unrewardedProposals] = await tryAsync(
    api.query.governance.unrewardedProposals.entries(),
  );

  if (queryError !== undefined) {
    console.error("Error querying unrewarded proposals:", queryError);
    return [];
  }

  const result: number[] = [];
  for (const [key] of unrewardedProposals) {
    const [parseError, id] = trySync(() => sb_id.parse(key.args[0]));
    if (parseError !== undefined) {
      console.error("Error parsing proposal ID:", parseError);
      continue;
    }

    if (!isNaN(id)) {
      result.push(id);
    }
  }

  return result;
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
  const [notDelegatingError, notDelegatingAddresses] = await tryAsync(
    queryAccountsNotDelegatingVotingPower(api),
  );

  if (notDelegatingError !== undefined) {
    console.error(
      "Error querying accounts not delegating voting power:",
      notDelegatingError,
    );
    return [];
  }

  const [stakeFromError, stakeFrom] = await tryAsync(
    queryCachedStakeFrom(torusCacheUrl),
  );
  if (stakeFromError !== undefined) {
    console.error("Error querying cached stake from:", stakeFromError);
    return [];
  }

  const [stakeOutError, stakeOut] = await tryAsync(
    queryCachedStakeOut(torusCacheUrl),
  );
  if (stakeOutError !== undefined) {
    console.error("Error querying cached stake out:", stakeOutError);
    return [];
  }

  const notDelegatingSet = new Set(notDelegatingAddresses);

  const [mapError, stakeOutMap] = trySync(
    () =>
      new Map(
        Object.entries(stakeOut.perAddr).map(([key, value]) => [
          key,
          BigInt(value),
        ]),
      ),
  );

  if (mapError !== undefined) {
    console.error("Error creating stake out map:", mapError);
    return [];
  }

  const [mapFromError, stakeFromMap] = trySync(
    () =>
      new Map(
        Object.entries(stakeFrom.perAddr).map(([key, value]) => [
          key,
          BigInt(value),
        ]),
      ),
  );

  if (mapFromError !== undefined) {
    console.error("Error creating stake from map:", mapFromError);
    return [];
  }

  // Pre-calculate total stake for each address
  const totalStakeMap = new Map<SS58Address, bigint>();
  const allAddresses = new Set([...votesFor, ...votesAgainst]);

  for (const address of allAddresses) {
    const stakeFromValue = stakeFromMap.get(address) ?? 0n;
    const stakeOutValue = stakeOutMap.get(address) ?? 0n;

    const totalStake =
      stakeOutValue > 0n && !notDelegatingSet.has(address)
        ? 0n
        : stakeFromValue + stakeOutValue;
    totalStakeMap.set(address, totalStake);
  }

  // Process all votes and push it to an array to avoid spread
  const processedVotes: VoteWithStake[] = [];
  votesFor.forEach((address) => {
    processedVotes.push({
      address,
      stake: totalStakeMap.get(address) ?? 0n,
      vote: "IN_FAVOR" as const,
    });
  });

  votesAgainst.forEach((address) => {
    processedVotes.push({
      address,
      stake: totalStakeMap.get(address) ?? 0n,
      vote: "AGAINST" as const,
    });
  });

  // Sort the processed votes
  processedVotes.sort((a, b) => Number(b.stake - a.stake));
  return processedVotes;
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
  const [queryError, query] = await tryAsync(
    api.query.governance.agentApplications.entries(),
  );

  if (queryError !== undefined) {
    console.error("Error querying agent applications:", queryError);
    return [];
  }

  const [handleError, result] = trySync(() =>
    handleMapValues(query, sb_some(AGENT_APPLICATION_SCHEMA)),
  );

  if (handleError !== undefined) {
    console.error(
      "Error handling map values for agent applications:",
      handleError,
    );
    return [];
  }

  const [daos, errs] = result;
  for (const err of errs) {
    console.error(err);
  }

  return daos;
}

export async function queryAgentApplicationById(
  api: Api,
  applicationId: number,
): Promise<AgentApplication | null> {
  const [agentApplicationErr, agentApplication] = await tryAsync(
    api.query.governance.agentApplications(applicationId),
  );

  if (agentApplicationErr !== undefined) {
    console.error("Error querying agent applications:", agentApplicationErr);
    throw agentApplicationErr;
  }

  const [parseError, parsed] = trySync(() =>
    AGENT_APPLICATION_SCHEMA.parse(agentApplication.unwrap()),
  );

  if (parseError !== undefined) {
    console.error("Error parsing agent application:", parseError);
    throw parseError;
  }

  return parsed;
}

// == Dao Treasury ==

export type DaoTreasuryAddress = z.infer<typeof sb_address>;

export async function queryDaoTreasuryAddress(
  api: Api,
): Promise<DaoTreasuryAddress> {
  const [queryError, addr] = await tryAsync(
    api.query.governance.daoTreasuryAddress(),
  );

  if (queryError !== undefined) {
    console.error("Error querying DAO treasury address:", queryError);
    throw queryError;
  }

  const [parseError, parsedAddr] = trySync(() => sb_address.parse(addr));

  if (parseError !== undefined) {
    console.error("Error parsing DAO treasury address:", parseError);
    throw parseError;
  }

  return parsedAddr;
}

export async function queryAccountsNotDelegatingVotingPower(
  api: Api,
): Promise<SS58Address[]> {
  const [queryError, value] = await tryAsync(
    api.query.governance.notDelegatingVotingPower(),
  );

  if (queryError !== undefined) {
    console.error(
      "Error querying accounts not delegating voting power:",
      queryError,
    );
    throw queryError;
  }

  const [parseError, parsedValue] = trySync(() =>
    sb_array(sb_address).parse(value),
  );

  if (parseError !== undefined) {
    console.error(
      "Error parsing accounts not delegating voting power:",
      parseError,
    );
    throw parseError;
  }

  return parsedValue;
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
  const [queryError, config] = await tryAsync(
    api.query.governance.globalGovernanceConfig(),
  );

  if (queryError !== undefined) {
    console.error("Error querying global governance config:", queryError);
    throw queryError;
  }

  const [parseError, parsedConfig] = trySync(() =>
    GOVERNANCE_CONFIGURATION_SCHEMA.parse(config),
  );

  if (parseError !== undefined) {
    console.error("Error parsing global governance config:", parseError);
    throw parseError;
  }

  return parsedConfig;
}

export async function queryTreasuryEmissionFee(api: Api): Promise<Percent> {
  const [queryError, treasuryEmissionFee] = await tryAsync(
    api.query.governance.treasuryEmissionFee(),
  );

  if (queryError !== undefined) {
    console.error("Error querying treasury emission fee:", queryError);
    throw queryError;
  }

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
  const [treasuryError, treasuryAddress] = await tryAsync(
    queryDaoTreasuryAddress(api),
  );

  if (treasuryError !== undefined) {
    console.error(
      "Error querying DAO treasury address for reward allocation:",
      treasuryError,
    );
    throw treasuryError;
  }

  const [balanceError, balance] = await tryAsync(
    queryFreeBalance(api, treasuryAddress),
  );

  if (balanceError !== undefined) {
    console.error(
      "Error querying free balance for reward allocation:",
      balanceError,
    );
    throw balanceError;
  }

  const [configError, governanceConfig] = await tryAsync(
    queryGlobalGovernanceConfig(api),
  );

  if (configError !== undefined) {
    console.error(
      "Error querying global governance config for reward allocation:",
      configError,
    );
    throw configError;
  }

  return getRewardAllocation(governanceConfig, balance);
}

// == Whitelist ==

export async function pushToWhitelist(
  api: ApiPromise,
  moduleKey: SS58Address,
  mnemonic: string | undefined,
) {
  if (!mnemonic) {
    throw new Error("No sudo mnemonic provided");
  }

  const [keyringError, keyring] = trySync(
    () => new Keyring({ type: "sr25519" }),
  );

  if (keyringError !== undefined) {
    console.error("Error creating keyring:", keyringError);
    throw keyringError;
  }

  const [keypairError, sudoKeypair] = trySync(() =>
    keyring.addFromUri(mnemonic),
  );

  if (keypairError !== undefined) {
    console.error("Error creating keypair from mnemonic:", keypairError);
    throw keypairError;
  }

  const [encodeError, accountId] = trySync(() =>
    encodeAddress(moduleKey, ADDRESS_FORMAT),
  );

  if (encodeError !== undefined) {
    console.error("Error encoding address:", encodeError);
    throw encodeError;
  }

  const [txError, tx] = trySync(() =>
    api.tx.governance.addToWhitelist(accountId),
  );

  if (txError !== undefined) {
    console.error("Error creating transaction:", txError);
    throw txError;
  }

  const [sendError, extrinsic] = await tryAsync(
    (() => tx.signAndSend(sudoKeypair))(),
  );

  if (sendError !== undefined) {
    console.error("Error signing and sending transaction:", sendError);
    return false;
  }

  console.log("Extrinsic:", extrinsic.hash.toHex());
  return true;
}

export async function queryWhitelist(api: Api): Promise<SS58Address[]> {
  const whitelist: SS58Address[] = [];

  const [entriesError, entries] = await tryAsync(
    api.query.governance.whitelist.entries(),
  );

  if (entriesError !== undefined) {
    console.error("Error querying whitelist entries:", entriesError);
    throw entriesError;
  }

  for (const [keys, _value] of entries) {
    const [parseError, address] = trySync(() => sb_address.parse(keys.args[0]));

    if (parseError !== undefined) {
      console.error("Error parsing whitelist address:", parseError);
      continue;
    }

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

  const [encodeError, accountId] = trySync(() =>
    encodeAddress(moduleKey, ADDRESS_FORMAT),
  );

  if (encodeError !== undefined) {
    console.error("Error encoding address for whitelist removal:", encodeError);
    throw encodeError;
  }

  const [txError, tx] = trySync(() =>
    api.tx.governance.removeFromWhitelist(accountId),
  );

  if (txError !== undefined) {
    console.error("Error creating transaction for whitelist removal:", txError);
    throw txError;
  }

  const [keyringError, keyring] = trySync(
    () => new Keyring({ type: "sr25519" }),
  );

  if (keyringError !== undefined) {
    console.error(
      "Error creating keyring for whitelist removal:",
      keyringError,
    );
    throw keyringError;
  }

  const [keypairError, sudoKeypair] = trySync(() =>
    keyring.addFromUri(mnemonic),
  );

  if (keypairError !== undefined) {
    console.error(
      "Error creating keypair for whitelist removal:",
      keypairError,
    );
    throw keypairError;
  }

  const [sendError, extrinsic] = await tryAsync(tx.signAndSend(sudoKeypair));

  if (sendError !== undefined) {
    console.error(
      "Error signing and sending whitelist removal transaction:",
      sendError,
    );
    throw sendError;
  }

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

  const [txError, tx] = trySync(() =>
    api.tx.governance.acceptApplication(proposalId),
  );

  if (txError !== undefined) {
    console.error(
      "Error creating transaction for accepting application:",
      txError,
    );
    throw txError;
  }

  const [keyringError, keyring] = trySync(
    () => new Keyring({ type: "sr25519" }),
  );

  if (keyringError !== undefined) {
    console.error(
      "Error creating keyring for accepting application:",
      keyringError,
    );
    throw keyringError;
  }

  const [keypairError, sudoKeypair] = trySync(() =>
    keyring.addFromUri(mnemonic),
  );

  if (keypairError !== undefined) {
    console.error(
      "Error creating keypair for accepting application:",
      keypairError,
    );
    throw keypairError;
  }

  const [sendError, extrinsic] = await tryAsync(tx.signAndSend(sudoKeypair));

  if (sendError !== undefined) {
    console.error(
      "Error signing and sending accept application transaction:",
      sendError,
    );
    throw sendError;
  }

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

  const [txError, tx] = trySync(() =>
    api.tx.governance.penalizeAgent(agentKey, penaltyFactor),
  );

  if (txError !== undefined) {
    console.error("Error creating transaction for penalizing agent:", txError);
    throw txError;
  }

  const [keyringError, keyring] = trySync(
    () => new Keyring({ type: "sr25519" }),
  );

  if (keyringError !== undefined) {
    console.error("Error creating keyring for penalizing agent:", keyringError);
    throw keyringError;
  }

  const [keypairError, sudoKeypair] = trySync(() =>
    keyring.addFromUri(mnemonic),
  );

  if (keypairError !== undefined) {
    console.error("Error creating keypair for penalizing agent:", keypairError);
    throw keypairError;
  }

  const [sendError, extrinsic] = await tryAsync(tx.signAndSend(sudoKeypair));

  if (sendError !== undefined) {
    console.error(
      "Error signing and sending penalize agent transaction:",
      sendError,
    );
    throw sendError;
  }

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

  const [txError, tx] = trySync(() =>
    api.tx.governance.denyApplication(proposalId),
  );
  const [keyringError, keyring] = trySync(
    () => new Keyring({ type: "sr25519" }),
  );

  if (txError !== undefined) {
    console.error(
      "Error creating transaction for denying application:",
      txError,
    );
    throw txError;
  }

  if (keyringError !== undefined) {
    console.error(
      "Error creating keyring for denying application:",
      keyringError,
    );
    throw keyringError;
  }

  const [keypairError, sudoKeypair] = trySync(() =>
    keyring.addFromUri(mnemonic),
  );

  if (keypairError !== undefined) {
    console.error(
      "Error creating keypair for denying application:",
      keypairError,
    );
    throw keypairError;
  }

  const [sendError, extrinsic] = await tryAsync(tx.signAndSend(sudoKeypair));

  if (sendError !== undefined) {
    console.error(
      "Error signing and sending deny application transaction:",
      sendError,
    );
    throw sendError;
  }

  return extrinsic;
}
