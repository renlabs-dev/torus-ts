// TODO: refactor / split modules

import type { ApiPromise } from "@polkadot/api";
import type { KeyringPair } from "@polkadot/keyring/types";
import type { Percent } from "@polkadot/types/interfaces";
import type { z } from "zod";
import type { SS58Address } from "../address";
import type { Balance } from "../types";
import {
  sb_address,
  sb_balance,
  sb_bigint,
  sb_number_int,
  sb_option_default,
  sb_percent,
  sb_some,
  sb_string,
  sb_struct,
} from "../types";
import type { Api } from "./_common";
import { handleDoubleMapEntries, handleMapEntries } from "./_common";
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";

// ==== Balances ====

export async function queryFreeBalance(
  api: Api,
  address: SS58Address,
): Promise<Balance> {
  const [queryError, q] = await tryAsync(api.query.system.account(address));
  if (queryError !== undefined) {
    console.error("Error querying free balance:", queryError);
    throw queryError;
  }

  const [parseError, balance] = trySync(() => sb_balance.parse(q.data.free));
  if (parseError !== undefined) {
    console.error("Error parsing free balance:", parseError);
    throw parseError;
  }

  return balance;
}

export async function queryMinAllowedStake(api: Api): Promise<bigint> {
  const [queryError, q] = await tryAsync(api.query.torus0.minAllowedStake());
  if (queryError !== undefined) {
    console.error("Error querying minimum allowed stake:", queryError);
    throw queryError;
  }

  const [parseError, minAllowedStake] = trySync(() => sb_balance.parse(q));
  if (parseError !== undefined) {
    console.error("Error parsing minimum allowed stake:", parseError);
    throw parseError;
  }

  return minAllowedStake;
}

const sb_balance_option_zero = sb_option_default(sb_balance, 0n);

export async function queryTotalStake(api: Api): Promise<Balance> {
  const [queryError, q] = await tryAsync(api.query.torus0.totalStake());
  if (queryError !== undefined) {
    console.error("Error querying total stake:", queryError);
    throw queryError;
  }

  const [parseError, balance] = trySync(() => sb_balance.parse(q));
  if (parseError !== undefined) {
    console.error("Error parsing total stake:", parseError);
    throw parseError;
  }

  return balance;
}

export async function queryRewardInterval(api: Api): Promise<bigint> {
  const [queryError, result] = await tryAsync(
    api.query.torus0.rewardInterval(),
  );
  if (queryError !== undefined) {
    console.error("Error querying reward interval:", queryError);
    throw queryError;
  }

  const [parseError, parsed] = trySync(() => sb_bigint.parse(result));
  if (parseError !== undefined) {
    console.error("Error parsing reward interval:", parseError);
    throw parseError;
  }

  return parsed;
}

export async function queryTotalIssuance(api: Api): Promise<Balance> {
  const [queryError, q] = await tryAsync(api.query.balances.totalIssuance());
  if (queryError !== undefined) {
    console.error("Error querying total issuance:", queryError);
    throw queryError;
  }

  const [parseError, balance] = trySync(() => sb_balance.parse(q));
  if (parseError !== undefined) {
    console.error("Error parsing total issuance:", parseError);
    throw parseError;
  }

  return balance;
}

/** TODO: refactor: return Map */
export async function queryKeyStakingTo(
  api: Api,
  address: SS58Address,
): Promise<{ address: SS58Address; stake: Balance }[]> {
  const [queryError, q] = await tryAsync(
    api.query.torus0.stakingTo.entries(address),
  );
  if (queryError !== undefined) {
    console.error("Error querying staking to:", queryError);
    throw queryError;
  }

  const stakes: { address: SS58Address; stake: Balance }[] = [];

  for (const [key, value] of q) {
    const [parseKeyError, stakeToAddress] = trySync(() => key.args[1]);
    if (parseKeyError !== undefined) {
      console.error("Error parsing staking to key:", parseKeyError);
      continue;
    }

    const [parseAddrError, parsedAddress] = trySync(() =>
      sb_address.parse(stakeToAddress),
    );
    if (parseAddrError !== undefined) {
      console.error("Error parsing staking to address:", parseAddrError);
      continue;
    }

    const [parseStakeError, stake] = trySync(() =>
      sb_balance_option_zero.parse(value),
    );
    if (parseStakeError !== undefined) {
      console.error("Error parsing staking to stake:", parseStakeError);
      continue;
    }

    if (stake !== 0n) {
      stakes.push({ address: parsedAddress, stake });
    }
  }

  return stakes;
}

/** TODO: refactor: return Map */
export async function queryKeyStakedBy(
  api: Api,
  address: SS58Address,
): Promise<Map<SS58Address, bigint>> {
  const [queryError, q] = await tryAsync(
    api.query.torus0.stakedBy.entries(address),
  );
  if (queryError !== undefined) {
    console.error("Error querying staked by:", queryError);
    throw queryError;
  }

  const result = new Map<SS58Address, bigint>();

  for (const [key, value] of q) {
    const [parseKeyError, stakeFromAddress] = trySync(() => key.args[1]);
    if (parseKeyError !== undefined) {
      console.error("Error parsing staked by key:", parseKeyError);
      continue;
    }

    const [parseAddrError, parsedAddress] = trySync(() =>
      sb_address.parse(stakeFromAddress),
    );
    if (parseAddrError !== undefined) {
      console.error("Error parsing staked by address:", parseAddrError);
      continue;
    }

    const [parseStakeError, stake] = trySync(() =>
      sb_balance_option_zero.parse(value),
    );
    if (parseStakeError !== undefined) {
      console.error("Error parsing staked by stake:", parseStakeError);
      continue;
    }

    result.set(parsedAddress, stake);
  }

  return result;
}

/** TODO: refactor: return Map */
export async function queryKeyStakedTo(
  api: Api,
  address: SS58Address,
): Promise<Map<SS58Address, bigint>> {
  const [queryError, q] = await tryAsync(
    api.query.torus0.stakingTo.entries(address),
  );
  if (queryError !== undefined) {
    console.error("Error querying staked to:", queryError);
    throw queryError;
  }

  const result = new Map<SS58Address, bigint>();

  for (const [keys, value] of q) {
    const [parseKeyError, stakeToAddressRaw] = trySync(() => keys.args[1]);
    if (parseKeyError !== undefined) {
      console.error("Error parsing staked to key:", parseKeyError);
      continue;
    }

    const [parseAddrError, address] = trySync(() =>
      sb_address.parse(stakeToAddressRaw),
    );
    if (parseAddrError !== undefined) {
      console.error("Error parsing staked to address:", parseAddrError);
      continue;
    }

    const [parseStakeError, stake] = trySync(() => sb_balance.parse(value));
    if (parseStakeError !== undefined) {
      console.error("Error parsing staked to stake:", parseStakeError);
      continue;
    }

    result.set(address, stake);
  }

  return result;
}

export async function queryBurnValue(api: Api): Promise<bigint> {
  const [queryError, burn] = await tryAsync(api.query.torus0.burn());
  if (queryError !== undefined) {
    console.error("Error querying burn value:", queryError);
    throw queryError;
  }

  const [parseError, parsedBurn] = trySync(() => sb_bigint.parse(burn));
  if (parseError !== undefined) {
    console.error("Error parsing burn value:", parseError);
    throw parseError;
  }

  return parsedBurn;
}

export async function queryStakeIn(api: Api): Promise<{
  total: bigint;
  perAddr: Map<SS58Address, bigint>;
}> {
  const [queryError, q] = await tryAsync(api.query.torus0.stakedBy.entries());
  if (queryError !== undefined) {
    console.error("Error querying stake in:", queryError);
    throw queryError;
  }

  let total = 0n;
  const perAddr = new Map<SS58Address, bigint>();

  const [handleError, result] = trySync(() =>
    handleDoubleMapEntries(
      q,
      sb_address,
      sb_address,
      sb_option_default(sb_bigint, 0n),
    ),
  );

  if (handleError !== undefined) {
    console.error("Error handling stake in map entries:", handleError);
    throw handleError;
  }

  const [values, errs] = result;
  for (const err of errs) {
    console.error("ERROR:", err);
  }

  for (const [toAddr, fromAddrsMap] of values) {
    for (const [_fromAddr, staked] of fromAddrsMap) {
      total += staked;
      perAddr.set(toAddr, (perAddr.get(toAddr) ?? 0n) + staked);
    }
  }

  return {
    total,
    perAddr,
  };
}

export async function getPermissions(api: Api) {
  const [queryError, q] = await tryAsync(api.query.permission0.permissions());
  if (queryError !== undefined) {
    console.error("Error querying permissions:", queryError);
    throw queryError;
  }

  const [parseError, permissions] = trySync(() => sb_some(sb_string).parse(q));
  if (parseError !== undefined) {
    console.error("Error parsing permissions:", parseError);
    throw parseError;
  }

  return permissions;
}
export async function queryStakeOut(api: Api): Promise<{
  total: bigint;
  perAddr: Map<SS58Address, bigint>;
}> {
  const [queryError, q] = await tryAsync(api.query.torus0.stakingTo.entries());
  if (queryError !== undefined) {
    console.error("Error querying stake out:", queryError);
    throw queryError;
  }

  let total = 0n;
  const perAddr = new Map<SS58Address, bigint>();

  const [handleError, result] = trySync(() =>
    handleDoubleMapEntries(
      q,
      sb_address,
      sb_address,
      sb_option_default(sb_bigint, 0n),
    ),
  );

  if (handleError !== undefined) {
    console.error("Error handling stake out map entries:", handleError);
    throw handleError;
  }

  const [values, errs] = result;
  for (const err of errs) {
    console.error("ERROR:", err);
  }

  for (const [fromAddr, toAddrsMap] of values) {
    for (const [_toAddr, staked] of toAddrsMap) {
      total += staked;
      perAddr.set(fromAddr, (perAddr.get(fromAddr) ?? 0n) + staked);
    }
  }

  return {
    total,
    perAddr,
  };
}

// ==== Emission ====

export async function queryRecyclingPercentage(api: Api): Promise<Percent> {
  const [queryError, recyclingPercentage] = await tryAsync(
    api.query.emission0.emissionRecyclingPercentage(),
  );

  if (queryError !== undefined) {
    console.error("Error querying recycling percentage:", queryError);
    throw queryError;
  }

  return recyclingPercentage;
}

export async function queryIncentivesRatio(api: Api): Promise<Percent> {
  const [queryError, incentivesRatio] = await tryAsync(
    api.query.emission0.incentivesRatio(),
  );
  if (queryError !== undefined) {
    console.error("Error querying incentives ratio:", queryError);
    throw queryError;
  }

  return incentivesRatio;
}

export function queryBlockEmission(api: Api): bigint {
  const [queryError, q] = trySync(() => api.consts.emission0.blockEmission);
  if (queryError !== undefined) {
    console.error("Error querying block emission:", queryError);
    throw queryError;
  }

  const [parseError, emission] = trySync(() => sb_bigint.parse(q));
  if (parseError !== undefined) {
    console.error("Error parsing block emission:", parseError);
    throw parseError;
  }

  return emission;
}

// ==== Agents ====

export const FEES_SCHEMA = sb_struct({
  stakingFee: sb_number_int,
  weightControlFee: sb_number_int,
});

export const AGENT_SCHEMA = sb_struct({
  key: sb_address,
  name: sb_string,
  url: sb_string,
  metadata: sb_string,
  weightPenaltyFactor: sb_percent,
  registrationBlock: sb_bigint,
  fees: FEES_SCHEMA,
});

export type Agent = z.infer<typeof AGENT_SCHEMA>;

export async function queryAgents(api: Api) {
  const [queryError, q] = await tryAsync(api.query.torus0.agents.entries());
  if (queryError !== undefined) {
    console.error("Error querying agents:", queryError);
    throw queryError;
  }

  const [handleError, result] = trySync(() =>
    handleMapEntries(q, sb_address, sb_some(AGENT_SCHEMA)),
  );
  if (handleError !== undefined) {
    console.error("Error handling agents map entries:", handleError);
    throw handleError;
  }

  const [agents, errs] = result;
  for (const err of errs) {
    console.error("ERROR:", err);
    throw new Error("Error in queryAgents");
  }

  return agents;
}

// == Weights ==

export async function setChainWeights(
  api: ApiPromise,
  keypair: KeyringPair,
  weights: [SS58Address, number][],
) {
  const [createTxError, tx] = trySync(() =>
    api.tx.emission0.setWeights(weights),
  );
  if (createTxError !== undefined) {
    console.error("Error creating set weights transaction:", createTxError);
    throw createTxError;
  }

  const [signError, signedTx] = await tryAsync(tx.signAndSend(keypair));
  if (signError !== undefined) {
    console.error(
      "Error signing and sending set weights transaction:",
      signError,
    );
    throw signError;
  }

  return signedTx;
}

export interface RegisterAgent {
  api: ApiPromise;
  agentKey: SS58Address;
  name: string;
  url: string;
  metadata: string;
}

/**
 * Register an agent on the network
 */
export function registerAgent({
  api,
  agentKey,
  name,
  url,
  metadata,
}: RegisterAgent) {
  return api.tx.torus0.registerAgent(agentKey, name, url, metadata);
}
