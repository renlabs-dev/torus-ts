import type { SS58Address } from "../address";
import type { Balance } from "../types";
import type { Api } from "./_common";
import { sb_address, sb_balance, sb_bigint } from "../types";
import { handleDoubleMapEntries, handleMapEntries } from "./_common";

export async function queryBridgedBalance(
  api: Api,
  key: SS58Address,
): Promise<Balance> {
  const q = await api.query.subspaceModule.bridged(key);
  const balance = sb_balance.parse(q);
  return balance;
}

export async function queryBridgedBalances(
  api: Api,
): Promise<[Map<SS58Address, Balance>, Error[]]> {
  const q = await api.query.subspaceModule.bridged.entries();
  return handleMapEntries(q, sb_address, sb_balance);
}

export async function queryFreeBalance(
  api: Api,
  address: SS58Address,
): Promise<Balance> {
  const q = await api.query.system.account(address);
  const balance = sb_balance.parse(q.data.free);
  return balance;
}

export async function queryKeyStakingTo(
  api: Api,
  address: SS58Address,
): Promise<{ address: SS58Address; stake: Balance }[]> {
  const q = await api.query.subspaceModule.stakeTo.entries(address);

  const stakes = q.map(([key, value]) => {
    const [, stakeToAddress] = key.args;
    const stake = sb_balance.parse(value);

    return {
      address: sb_address.parse(stakeToAddress),
      stake,
    };
  });

  return stakes.filter((stake) => stake.stake !== 0n);
}

export async function queryKeyStakedBy(
  api: Api,
  address: SS58Address,
): Promise<{ address: SS58Address; stake: Balance }[]> {
  const q = await api.query.subspaceModule.stakeFrom.entries(address);

  const stakes = q.map(([key, value]) => {
    const [, stakeFromAddress] = key.args;
    const stake = sb_balance.parse(value);

    return {
      address: sb_address.parse(stakeFromAddress),
      stake,
    };
  });

  return stakes.filter((stake) => stake.stake !== 0n);
}

export async function queryStakeIn(api: Api): Promise<{
  total: bigint;
  perAddr: Map<SS58Address, bigint>;
}> {
  const q = await api.query.subspaceModule.stakeFrom.entries();

  let total = 0n;
  const perAddr = new Map<SS58Address, bigint>();

  const [values, errs] = handleDoubleMapEntries(
    q,
    sb_address,
    sb_address,
    sb_bigint,
  );

  for (const err of errs) {
    console.error(err);
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
  const q = await api.query.subspaceModule.stakeTo.entries();

  let total = 0n;
  const perAddr = new Map<SS58Address, bigint>();

  const [values, errs] = handleDoubleMapEntries(
    q,
    sb_address,
    sb_address,
    sb_bigint,
  );

  for (const err of errs) {
    console.error(err);
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
