import type { SS58Address } from "../address";
import type { Balance } from "../types";
import type { Api } from "./_common";
import { sb_balance } from "../types";

async function queryUserBridgedBalance(
  api: Api,
  key: SS58Address,
): Promise<Balance> {
  const q = await api.query.subspaceModule.bridged!(key);
  const balance = sb_balance.parse(q);
  return balance;
}

// async function queryBirdgeBalances(
//   api: Api,
// ): Promise<Map<SS58Address, Balance>> {
//   const q = await api.query.subspaceModule.bridged!.entries();
//   const
// }
