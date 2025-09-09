import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";
import type { SS58Address } from "../../types/address.js";
import type { Balance } from "../../types/index.js";
import {
  sb_address,
  sb_balance,
  sb_bigint,
  sb_option_default,
  sb_some,
} from "../../types/index.js";
import {
  handleDoubleMapEntries,
  handleMapEntries,
} from "../common/storage-maps.js";
import type { Api } from "../common/types.js";
import type { NamespaceEntry } from "./torus0-types.js";
import {
  AGENT_SCHEMA,
  NAMESPACE_METADATA_SCHEMA,
  NAMESPACE_OWNERSHIP_SCHEMA,
  sb_namespace_path,
} from "./torus0-types.js";

// ==== Agents ====

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

// ==== Namespace ====

export async function queryNamespaceEntriesOf(
  api: Api,
  agent: SS58Address,
): Promise<NamespaceEntry[]> {
  const ownership = { Account: agent };

  const [queryErr, queryRes] = await tryAsync(
    api.query.torus0.namespaces.entries(ownership),
  );
  if (queryErr !== undefined) {
    throw queryErr;
  }

  const [handleError, result] = trySync(() =>
    handleDoubleMapEntries(
      queryRes,
      NAMESPACE_OWNERSHIP_SCHEMA,
      sb_namespace_path,
      sb_some(NAMESPACE_METADATA_SCHEMA),
    ),
  );

  if (handleError !== undefined) {
    throw handleError;
  }

  const [entriesMap] = result;
  const namespaceEntries: NamespaceEntry[] = [];

  for (const [_ownershipKey, pathsMap] of entriesMap) {
    // match(ownershipKey)({
    //   Account(_accountAddress) {},
    //   System() {},
    // });
    for (const [pathSegments, metadata] of pathsMap) {
      namespaceEntries.push({
        path: pathSegments,
        createdAt: metadata.createdAt,
        deposit: metadata.deposit,
      });
    }
  }

  return namespaceEntries;
}

// ==== Staking ====

const sb_balance_option_zero = sb_option_default(sb_balance, 0n);

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

export async function queryAgentBurn(api: Api): Promise<bigint> {
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
