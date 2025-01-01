import type { SS58Address } from "../address";
import type { Balance } from "../types";
import type { Api } from "./_common";
import {
  sb_address,
  sb_balance,
  sb_bigint,
  sb_option_default,
  sb_percent,
  sb_string,
  sb_struct,
} from "../types";
import { handleDoubleMapEntries } from "./_common";

// ==== Balances ====

export async function queryFreeBalance(
  api: Api,
  address: SS58Address,
): Promise<Balance> {
  const q = await api.query.system.account(address);
  const balance = sb_balance.parse(q.data.free);
  return balance;
}

const sb_balance_option_zero = sb_option_default(sb_balance, 0n);

/** TODO: refactor: return Map */
export async function queryKeyStakingTo(
  api: Api,
  address: SS58Address,
): Promise<{ address: SS58Address; stake: Balance }[]> {
  const q = await api.query.torus0.stakingTo.entries(address);

  const stakes = q.map(([key, value]) => {
    const [, stakeToAddress] = key.args;

    const address = sb_address.parse(stakeToAddress);
    const stake = sb_balance_option_zero.parse(value);

    return { address, stake };
  });

  return stakes.filter(({ stake }) => stake !== 0n);
}

/** TODO: refactor: return Map */
export async function queryKeyStakedBy(
  api: Api,
  address: SS58Address,
): Promise<{ address: SS58Address; stake: Balance }[]> {
  const q = await api.query.torus0.stakedBy.entries(address);

  const stakes = q.map(([key, value]) => {
    const [, stakeFromAddress] = key.args;

    const address = sb_address.parse(stakeFromAddress);
    const stake = sb_balance_option_zero.parse(value);

    return {
      address,
      stake,
    };
  });

  return stakes.filter(({ stake }) => stake !== 0n);
}

export async function queryStakeIn(api: Api): Promise<{
  total: bigint;
  perAddr: Map<SS58Address, bigint>;
}> {
  const q = await api.query.torus0.stakedBy.entries();

  let total = 0n;
  const perAddr = new Map<SS58Address, bigint>();

  const [values, errs] = handleDoubleMapEntries(
    q,
    sb_address,
    sb_address,
    sb_option_default(sb_bigint, 0n),
  );

  for (const err of errs) {
    // TODO: refactor out
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

export async function queryStakeOut(api: Api): Promise<{
  total: bigint;
  perAddr: Map<SS58Address, bigint>;
}> {
  const q = await api.query.torus0.stakingTo.entries();

  let total = 0n;
  const perAddr = new Map<SS58Address, bigint>();

  const [values, errs] = handleDoubleMapEntries(
    q,
    sb_address,
    sb_address,
    sb_option_default(sb_bigint, 0n),
  );

  for (const err of errs) {
    // TODO: refactor out
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

// ==== Agents ====

// type Query = Api["query"];
// interface StorageHandler<F extends AnyFunction, A extends AnyTuple> {
//   storage: (query: Query) => StorageEntryBaseAt<"promise", F, A>;
//   handler: (entry: [StorageKey<A>, Codec]) => ReturnType<F>;
// }

export const AGENT_SCHEMA = sb_struct({
  key: sb_address,
  name: sb_string,
  url: sb_string,
  metadata: sb_string,
  weight_factor: sb_percent,
});
