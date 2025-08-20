import "@polkadot/api/augment";

import type { Percent } from "@polkadot/types/interfaces";

import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";

import {
  queryCachedStakeFrom,
  queryCachedStakeOut,
} from "../../cached-queries.js";
import type { SS58Address } from "../../types/address.js";
import { sb_address, sb_array, sb_id, sb_some } from "../../types/index.js";
import { queryFreeBalance } from "../balances.js";
import type { Api } from "../common/fees.js";
import { handleMapValues } from "../common/fees.js";
import type {
  AgentApplication,
  DaoTreasuryAddress,
  GovernanceConfiguration,
  Proposal,
  VoteWithStake,
} from "./governance-types.js";
import {
  AGENT_APPLICATION_SCHEMA,
  GOVERNANCE_CONFIGURATION_SCHEMA,
  PROPOSAL_SCHEMA,
} from "./governance-types.js";

// ==== Proposals ====

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

// ==== Dao Treasury ====

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

// ==== Whitelist ====

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
