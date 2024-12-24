import type { StorageKey } from "@polkadot/types";
import type { AnyTuple, Codec } from "@polkadot/types/types";
import { z } from "zod";

import type { SS58Address } from "../address";
import type { Balance } from "../types";
import type { Api } from "./_common";
import { SS58_SCHEMA } from "../address";
import { sb_address, sb_balance, sb_bigint } from "../types";
import { handleDoubleMapEntries } from "./_common";

export * from "./bridge";

export async function queryFreeBalance(api: Api, address: SS58Address) {
  const q = await api.query.system.account(address);
  const balance = sb_balance.parse(q.data.free);
  return balance;
}

/** TODO: return Map */
export async function queryKeyStakingTo(api: Api, address: SS58Address) {
  const q = await api.query.subspaceModule.stakeTo.entries(address);

  const stakes = q.map(([key, value]) => {
    const [, stakeToAddress] = key.args;
    const stake = sb_balance.parse(value);
    const address = sb_address.parse(stakeToAddress);
    return { address, stake };
  });

  return stakes.filter(({ stake }) => stake !== 0n);
}

/** TODO: return Map */
export async function queryKeyStakedBy(
  api: Api,
  address: SS58Address,
): Promise<{ address: SS58Address; stake: Balance }[]> {
  const q = await api.query.subspaceModule.stakeFrom.entries(address);

  const stakes = q.map(([key, value]) => {
    const [, stakeFromAddress] = key.args;
    const stake = sb_balance.parse(value);
    const address = sb_address.parse(stakeFromAddress);

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

// == Modules == TODO: Refactor

export const SUBSPACE_AGENT_SCHEMA = z.object({
  key: SS58_SCHEMA,
  name: z.string().optional(),
  apiUrl: z.string().optional(),
  registrationBlock: z.coerce.number().optional(),
  metadataUri: z.string().optional(),
  atBlock: z.coerce.number().optional(),

  weightFactor: z.coerce.number().optional(),

  totalStaked: z.coerce.bigint(),
  totalStakers: z.coerce.number(),
});

export type SubspaceAgent = z.infer<typeof SUBSPACE_AGENT_SCHEMA>;

export const SUBSPACE_MODULE_SCHEMA = z.object({
  netuid: z.coerce.number(),
  key: SS58_SCHEMA,
  uid: z.coerce.number().int(),
  name: z.string().optional(),
  address: z.string().optional(),
  registrationBlock: z.coerce.number().optional(),
  metadata: z.string().optional(),
  lastUpdate: z.unknown().optional(),
  atBlock: z.coerce.number().optional(),

  emission: z.coerce.bigint().optional(),
  incentive: z.coerce.bigint().optional(),
  dividends: z.coerce.bigint().optional(),
  delegationFee: z.coerce.number().optional(),

  totalStaked: z.coerce.bigint(),
  totalStakers: z.coerce.number(),
});

export type SubspaceModule = z.infer<typeof SUBSPACE_MODULE_SCHEMA>;

export type SubspacePalletName =
  | "subspaceModule"
  | "governanceModule"
  | "subnetEmissionModule";

export type SubspaceStorageName =
  | "emission"
  | "incentive"
  | "dividends"
  | "lastUpdate"
  | "metadata"
  | "registrationBlock"
  | "name"
  | "address"
  | "keys"
  | "subnetNames"
  | "immunityPeriod"
  | "minAllowedWeights"
  | "maxAllowedWeights"
  | "tempo"
  | "maxAllowedUids"
  | "founder"
  | "founderShare"
  | "incentiveRatio"
  | "trustRatio"
  | "maxWeightAge"
  | "bondsMovingAverage"
  | "maximumSetWeightCallsPerEpoch"
  | "minValidatorStake"
  | "maxAllowedValidators"
  | "moduleBurnConfig"
  | "subnetMetadata"
  | "subnetGovernanceConfig"
  | "subnetEmission"
  | "delegationFee"
  | "stakeFrom"
  | "burn";

function standardizeUidToSS58address<T extends SubspaceStorageName, R>(
  outerRecord: Record<T, Record<string, R>>,
  uidToKey: Record<string, SS58Address>,
): Record<T, Record<string, R>> {
  const processedRecord: Record<T, Record<string, R>> = {} as Record<
    T,
    Record<string, R>
  >;

  const entries = Object.entries(outerRecord) as [T, Record<string, R>][];
  for (const [outerKey, innerRecord] of entries) {
    const processedInnerRecord: Record<string, R> = {};

    for (const [innerKey, value] of Object.entries(innerRecord)) {
      if (!isNaN(Number(innerKey))) {
        const newKey = uidToKey[innerKey];
        if (newKey !== undefined) {
          processedInnerRecord[newKey] = value;
        }
      } else {
        processedInnerRecord[innerKey] = value;
      }
    }

    processedRecord[outerKey] = processedInnerRecord;
  }

  return processedRecord;
}

export const STAKE_FROM_SCHEMA = z.object({
  stakeFromStorage: z
    .record(SS58_SCHEMA, z.record(SS58_SCHEMA, z.coerce.bigint()))
    .transform((val) => {
      const map = new Map<SS58Address, Map<SS58Address, bigint>>();
      const stakeMapEntries = Object.entries(val) as [
        SS58Address,
        Record<SS58Address, bigint>,
      ][];
      for (const [stakedInto, stakerMap] of stakeMapEntries) {
        const innerMap = new Map<SS58Address, bigint>();
        const stakers = Object.entries(stakerMap) as [SS58Address, bigint][];
        for (const [staker, stake] of stakers) {
          innerMap.set(staker, BigInt(stake));
        }
        map.set(stakedInto, innerMap);
      }
      return map;
    }),
});

// TODO: Refactor for Agents
export async function queryRegisteredModulesInfo(
  api: Api,
  netuid: number,
  blockNumber: number,
): Promise<SubspaceModule[]> {
  console.log("Fetching module keys from the chain...");
  const keyQuery: { subspaceModule: SubspaceStorageName[] } = {
    subspaceModule: ["keys"],
  };
  const uidToSS58Query = await queryChain(api, keyQuery, netuid);
  const uidToSS58 = uidToSS58Query.keys as Record<string, SS58Address>;
  const moduleProps: SubspaceStorageName[] = [
    "name",
    "address",
    "registrationBlock",
    "metadata",
    "lastUpdate",
    "emission",
    "incentive",
    "dividends",
    "delegationFee",
    "stakeFrom",
  ];

  const extraPropsQuery: { subspaceModule: SubspaceStorageName[] } = {
    subspaceModule: moduleProps,
  };
  const modulesInfo = await queryChain(api, extraPropsQuery, netuid);
  const processedModules = standardizeUidToSS58address(modulesInfo, uidToSS58);
  const moduleMap: SubspaceModule[] = [];
  const parsedStakeFromStorage = STAKE_FROM_SCHEMA.parse({
    stakeFromStorage: processedModules.stakeFrom,
  });
  const { stakeFromStorage } = parsedStakeFromStorage;

  for (const uid of Object.keys(uidToSS58)) {
    const moduleKey = uidToSS58[uid];
    if (moduleKey === undefined) {
      console.error(`Module key not found for uid ${uid}`);
      continue;
    }
    const module = SUBSPACE_MODULE_SCHEMA.parse({
      uid: uid,
      key: moduleKey,
      netuid: netuid,
      name: processedModules.name[moduleKey],
      address: processedModules.address[moduleKey],
      registrationBlock: processedModules.registrationBlock[moduleKey],
      metadata: processedModules.metadata[moduleKey],
      lastUpdate: processedModules.lastUpdate[moduleKey],
      atBlock: blockNumber,
      emission: processedModules.emission[moduleKey],
      incentive: processedModules.incentive[moduleKey],
      dividends: processedModules.dividends[moduleKey],
      delegationFee: processedModules.delegationFee[moduleKey],
      totalStaked: _sumKeyStaked(stakeFromStorage, moduleKey),
      totalStakers:
        parsedStakeFromStorage.stakeFromStorage.get(moduleKey)?.size ?? 0,
    });
    moduleMap.push(module);
  }
  return moduleMap;
}

export function _sumKeyStaked(
  stakeFromStorage: Map<SS58Address, Map<SS58Address, bigint>>,
  targetKey: SS58Address,
) {
  const stakerMap = stakeFromStorage.get(targetKey);
  let totalStake = 0n;
  if (stakerMap === undefined) {
    console.warn("Could not find StakeFrom map for key:", targetKey);
    return totalStake;
  }
  for (const stake of stakerMap.values()) {
    totalStake += stake;
  }
  return totalStake;
}

type StorageTypes = "VecMapping" | "NetuidMap" | "SimpleMap" | "DoubleMap";

export function getSubspaceStorageMappingKind(
  prop: SubspaceStorageName,
): StorageTypes | null {
  const vecProps: SubspaceStorageName[] = [
    "emission",
    "incentive",
    "dividends",
    "lastUpdate",
  ];
  const netuidMapProps: SubspaceStorageName[] = [
    "metadata",
    "registrationBlock",
    "name",
    "address",
    "keys",
  ];
  const simpleMapProps: SubspaceStorageName[] = [
    "minAllowedWeights",
    "maxWeightAge",
    "maxAllowedWeights",
    "trustRatio",
    "tempo",
    "founderShare",
    "subnetNames",
    "immunityPeriod",
    "maxAllowedUids",
    "founder",
    "incentiveRatio",
    "bondsMovingAverage",
    "maximumSetWeightCallsPerEpoch",
    "minValidatorStake",
    "maxAllowedValidators",
    "moduleBurnConfig",
    "subnetMetadata",
    "subnetGovernanceConfig",
    "subnetEmission",
    "delegationFee",
    "burn",
  ];
  const doubleMapProps: SubspaceStorageName[] = ["stakeFrom"];
  const mapping = {
    VecMapping: vecProps,
    NetuidMap: netuidMapProps,
    SimpleMap: simpleMapProps,
    DoubleMap: doubleMapProps,
  };
  if (mapping.VecMapping.includes(prop)) return "VecMapping";
  else if (mapping.NetuidMap.includes(prop)) return "NetuidMap";
  else if (mapping.SimpleMap.includes(prop)) return "SimpleMap";
  else if (mapping.DoubleMap.includes(prop)) return "DoubleMap";
  else return null;
}

export interface ChainEntry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  queryStorage(netuid?: number): Record<any, any>;
}

export async function getPropsToMap(
  props: Partial<Record<SubspacePalletName, SubspaceStorageName[]>>,
  api: Api,
  netuid?: number,
): Promise<Record<SubspaceStorageName, ChainEntry>> {
  const mapped_prop_entries: Record<SubspaceStorageName, ChainEntry> =
    {} as Record<SubspaceStorageName, ChainEntry>;

  for (const [palletName, storageNames] of Object.entries(props)) {
    const asyncOperations = storageNames.map(async (storageName) => {
      const value = getSubspaceStorageMappingKind(storageName);

      if (value === "NetuidMap") {
        const entries =
          await api.query[palletName]?.[storageName]?.entries(netuid);
        if (entries === undefined) {
          throw new Error(`No entries for ${palletName}.${storageName}`);
        }
      }
      const storageQuery = api.query[palletName]?.[storageName]?.entries;
      if (storageQuery === undefined) {
        throw new Error(`${palletName}.${storageName} doesn't exist`);
      }
      const entries =
        value === "NetuidMap"
          ? await storageQuery(netuid)
          : await storageQuery();

      switch (value) {
        case "VecMapping":
          mapped_prop_entries[storageName] = new StorageVecMap(entries);
          break;
        case "NetuidMap":
          mapped_prop_entries[storageName] = new NetuidMapEntries(entries);
          break;
        case "SimpleMap":
          mapped_prop_entries[storageName] = new SimpleMap(entries);
          break;
        case "DoubleMap":
          mapped_prop_entries[storageName] = new DoubleMapEntries(entries);
          break;
        default:
          throw new Error(`Unknown storage type ${value}`);
      }
    });

    await Promise.all(asyncOperations);
  }

  return mapped_prop_entries;
}

export class StorageVecMap implements ChainEntry {
  constructor(private readonly entry: [StorageKey<AnyTuple>, Codec][]) {}

  queryStorage(netuid: number) {
    const subnet_values = this.entry[netuid];
    if (subnet_values != undefined) {
      const values = subnet_values[1].toPrimitive() as string[];
      const modules_map = Object.fromEntries(
        values.map((value, index) => [index, value]),
      );
      return modules_map;
    } else return {};
  }
}

export class SimpleMap implements ChainEntry {
  constructor(private readonly entry: [StorageKey<AnyTuple>, Codec][]) {}

  queryStorage() {
    const storageData: Record<string, string> = {};
    this.entry.forEach((entry) => {
      const key = entry[0].args[0]?.toPrimitive() as string;
      const value = entry[1].toPrimitive() as string;
      storageData[key] = value;
    });
    return storageData;
  }
}

export class NetuidMapEntries implements ChainEntry {
  constructor(private readonly entries: [StorageKey<AnyTuple>, Codec][]) {}
  queryStorage() {
    const moduleIdToPropValue: Record<number, string> = {};
    this.entries.forEach((entry) => {
      const moduleCodec = entry[1];
      const moduleId = entry[0].args[1]?.toPrimitive() as number;
      moduleIdToPropValue[moduleId] = moduleCodec.toPrimitive() as string;
    });
    return moduleIdToPropValue;
  }
}
export class DoubleMapEntries implements ChainEntry {
  constructor(private readonly entries: [StorageKey<AnyTuple>, Codec][]) {}
  queryStorage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const moduleIdToPropValue: Record<any, Record<any, any>> = {};

    this.entries.forEach((entry) => {
      const keyFrom = entry[0].args[0]?.toPrimitive() as string;
      const keyTo = entry[0].args[1]?.toPrimitive() as string;
      if (moduleIdToPropValue[keyFrom] === undefined) {
        moduleIdToPropValue[keyFrom] = {};
      }
      moduleIdToPropValue[keyFrom][keyTo] = entry[1].toPrimitive() as string;
    });
    return moduleIdToPropValue;
  }
}

/**
 * Enriches the modules fetching the properties in `props`.
 * @returns the same moduleMap passed as argument.
 */
export async function queryChain<T extends SubspaceStorageName>(
  api: Api,
  props: Partial<Record<SubspacePalletName, T[]>>,
  netuidWhitelist?: number,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<Record<T, Record<string, string | Record<string, any>>>> {
  if (Object.keys(props).length === 0) {
    return {} as Record<T, Record<string, string>>;
  }
  // TODO: accept multiple netuids
  const modulePropMap: Record<T, Record<string, string>> = {} as Record<
    T,
    Record<string, string>
  >;
  const moduleEntries = await getPropsToMap(props, api, netuidWhitelist);
  const entries = Object.entries(moduleEntries) as [T, ChainEntry][];
  entries.map(([prop, entry]) => {
    modulePropMap[prop] = entry.queryStorage(netuidWhitelist);
  });
  return modulePropMap;
}

export async function getSubnetList(api: Api): Promise<Record<string, string>> {
  const result = await queryChain(api, { subspaceModule: ["subnetNames"] });
  const subnetNames = result.subnetNames;
  return subnetNames as Record<string, string>;
}

export async function getModuleBurn(api: Api): Promise<Record<string, string>> {
  const result = await queryChain(api, { subspaceModule: ["burn"] });
  const burn = result.burn;
  return burn as Record<string, string>;
}
