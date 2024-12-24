import type { SS58Address } from "../address";
import type { Balance } from "../types";
import type { Api } from "./_common";
import { sb_address, sb_balance } from "../types";
import { handleMapEntries } from "./_common";

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
