import { DateTime } from "luxon";
import { match } from "rustie";

import type { CustomDataError, Result } from "@torus-ts/utils";
import { buildIpfsGatewayUrl, parseIpfsUri } from "@torus-ts/utils/ipfs";

import type { SS58Address } from "./address";
import type {
  AnyTuple,
  Api,
  Codec,
  CustomMetadata,
  StorageKey,
} from "./old_types";
import type { Blocks } from "./types";
import { CUSTOM_METADATA_SCHEMA } from "./old_types";

export * from "@torus-ts/utils/subspace";

export const PARAM_FIELD_DISPLAY_NAMES = {
  // # Global
  maxNameLength: "Max Name Length",
  maxAllowedSubnets: "Max Allowed Subnets",
  maxAllowedModules: "Max Allowed Modules",
  unitEmission: "Unit Emission",
  floorDelegationFee: "Floor Delegation Fee",
  maxRegistrationsPerBlock: "Max Registrations Per Block",
  targetRegistrationsPerInterval: "Target Registrations Per Interval",
  targetRegistrationsInterval: "Target Registrations Interval",
  burnRate: "Burn Rate",
  minBurn: "Min Burn",
  maxBurn: "Max Burn",
  adjustmentAlpha: "Adjustment Alpha",
  minStake: "Min Stake",
  maxAllowedWeights: "Max Allowed Weights",
  minWeightStake: "Min Weight Stake",
  proposalCost: "Proposal Cost",
  proposalExpiration: "Proposal Expiration",
  proposalParticipationThreshold: "Proposal Participation Threshold",
  // # Subnet
  founder: "Founder",
  founderShare: "Founder Share",
  immunityPeriod: "Immunity Period",
  incentiveRatio: "Incentive Ratio",
  maxAllowedUids: "Max Allowed UIDs",
  // maxAllowedWeights: "Max Allowed Weights",
  maxStake: "Max Stake",
  maxWeightAge: "Max Weight Age",
  minAllowedWeights: "Min Allowed Weights",
  // minStake: "Min Stake",
  name: "Name",
  tempo: "Tempo",
  trustRatio: "Trust Ratio",
  voteMode: "Vote Mode",
} as const;

// == Handlers ==

// == Time ==

export function getExpirationTime(
  blockNumber: Blocks | undefined,
  expirationBlock: Blocks,
  relative = false,
): string {
  if (!blockNumber) return "Unknown";

  const blocksRemaining = expirationBlock - blockNumber;
  const secondsRemaining = blocksRemaining * 8; // 8 seconds per block

  const expirationDate = DateTime.now().plus({ seconds: secondsRemaining });
  if (relative) {
    return expirationDate.toRelative();
  }
  return expirationDate.toLocaleString(DateTime.DATETIME_SHORT);
}

export function getCreationTime(
  blockNumber: Blocks | undefined,
  referenceBlock: Blocks,
  relative = false,
) {
  if (!blockNumber) return "Unknown";

  const blocksAgo = blockNumber - referenceBlock;
  const secondsPassed = blocksAgo * 8; // 8 seconds per block

  const creationDate = DateTime.now().minus({ seconds: secondsPassed });

  if (relative) {
    return creationDate.toRelative();
  }

  return creationDate.toLocaleString(DateTime.DATETIME_SHORT);
}

export interface ChainEntry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  queryStorage(netuid?: number): Record<any, any>;
}

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

// TODO: add MinimumAllowedStake, stakeFrom

export function standardizeUidToSS58address<T extends SubspaceStorageName, R>(
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

export const paramNameToDisplayName = (paramName: string): string => {
  return (
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    PARAM_FIELD_DISPLAY_NAMES[
      paramName as keyof typeof PARAM_FIELD_DISPLAY_NAMES
    ] ?? paramName
  );
};
