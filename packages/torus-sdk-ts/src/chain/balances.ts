import type { ApiPromise } from "@polkadot/api";
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";
import type { SS58Address } from "../types/address.js";
import type { Balance } from "../types/index.js";
import { sb_balance } from "../types/index.js";
import type { Api } from "./common/types.js";

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

/**
 * Note: this is using `system.account`
 */
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

export async function queryBalance(api: Api, address: SS58Address) {
  const [queryError, q] = await tryAsync(api.query.system.account(address));
  if (queryError !== undefined) {
    console.error("Error querying free balance:", queryError);
    throw queryError;
  }

  const [parseFreeError, free] = trySync(() => sb_balance.parse(q.data.free));

  const [parseReservedError, reserved] = trySync(() =>
    sb_balance.parse(q.data.reserved),
  );

  if (parseFreeError !== undefined) {
    console.error("Error parsing free balance:", parseFreeError);
    throw parseFreeError;
  }
  if (parseReservedError !== undefined) {
    console.error("Error parsing reserved balance:", parseReservedError);
    throw parseReservedError;
  }
  return {
    free: free,
    staked: reserved,
  };
}

// ==== Transactions ====

/**
 * Transfer balance allowing the recipient account to be killed (go below existential deposit)
 */
export function transferAllowDeath(
  api: ApiPromise,
  to: SS58Address,
  amount: bigint,
) {
  return api.tx.balances.transferAllowDeath(to, amount);
}

/**
 * Transfer balance keeping the recipient account alive (above existential deposit)
 */
export function transferKeepAlive(
  api: ApiPromise,
  to: SS58Address,
  amount: bigint,
) {
  return api.tx.balances.transferKeepAlive(to, amount);
}
