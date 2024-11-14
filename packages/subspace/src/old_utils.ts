import type { ZodSchema } from "zod";
import { DateTime } from "luxon";
import { match } from "rustie";

import type { Result } from "@torus-ts/utils";
import { buildIpfsGatewayUrl, parseIpfsUri } from "@torus-ts/utils/ipfs";

import type { SS58Address } from "./address";
import type {
  AnyTuple,
  Api,
  Codec,
  CustomDaoMetadata,
  CustomDataError,
  CustomMetadata,
  DaoApplications,
  Proposal,
  StorageKey,
} from "./old_types";
import {
  CUSTOM_METADATA_SCHEMA,
  DAO_APPLICATIONS_SCHEMA,
  PROPOSAL_SCHEMA,
} from "./old_types";

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

export function handleEntries<T>(
  rawEntries: [unknown, Codec][] | undefined,
  parser: (value: Codec) => T | null,
): [T[], Error[]] {
  const entries: T[] = [];
  const errors: Error[] = [];
  for (const entry of rawEntries ?? []) {
    const [, valueRaw] = entry;
    const parsedEntry = parser(valueRaw);
    if (parsedEntry == null) {
      errors.push(new Error(`Invalid entry: ${entry.toString()}`));
      continue;
    }
    entries.push(parsedEntry);
  }
  entries.reverse();
  return [entries, errors];
}

export function handleProposals(
  rawProposals: [unknown, Codec][] | undefined,
): [Proposal[], Error[]] {
  return handleEntries(rawProposals, parseProposal);
}

export function handleDaos(
  rawDaos: [unknown, Codec][] | undefined,
): [DaoApplications[], Error[]] {
  return handleEntries(rawDaos, parseDaos);
}

// == Time ==

export function getExpirationTime(
  blockNumber: number | undefined,
  expirationBlock: number,
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
  blockNumber: number | undefined,
  creationBlock: number,
  relative = false,
) {
  if (!blockNumber) return "Unknown";

  const blocksAgo = blockNumber - creationBlock;
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

export function parseAddress(valueRaw: Codec): DaoApplications | null {
  const value = valueRaw.toPrimitive();
  const validated = DAO_APPLICATIONS_SCHEMA.safeParse(value);
  if (!validated.success) {
    return null;
  }
  return validated.data as unknown as DaoApplications;
}

export function parseDaos(valueRaw: Codec): DaoApplications | null {
  const value = valueRaw.toPrimitive();
  const validated = DAO_APPLICATIONS_SCHEMA.safeParse(value);
  if (!validated.success) {
    return null;
  }
  return validated.data as unknown as DaoApplications;
}

export function parseProposal(valueRaw: Codec): Proposal | null {
  const value = valueRaw.toPrimitive();
  const validated = PROPOSAL_SCHEMA.safeParse(value);
  if (!validated.success) {
    return null;
  }
  return validated.data;
}

export const paramNameToDisplayName = (paramName: string): string => {
  return (
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    PARAM_FIELD_DISPLAY_NAMES[
      paramName as keyof typeof PARAM_FIELD_DISPLAY_NAMES
    ] ?? paramName
  );
};

export function appendErrorInfo(
  err_msg: string,
  info: string,
  sep = " ",
): { Err: CustomDataError } {
  const message = err_msg + sep + info;
  return { Err: { message } };
}

export async function processMetadata(
  zodSchema: ZodSchema,
  url: string,
  entryId: number,
  kind?: string,
) {
  const response = await fetch(url);
  const obj: unknown = await response.json();

  const validated = zodSchema.safeParse(obj);
  if (!validated.success) {
    const message = `Invalid metadata for ${kind} ${entryId} at ${url}`;
    return { Err: { message } };
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  return { Ok: validated.data };
}

export async function processProposalMetadata(url: string, entryId: number) {
  return await processMetadata(
    CUSTOM_METADATA_SCHEMA,
    url,
    entryId,
    "proposal",
  );
}
export async function processDaoMetadata(
  url: string,
  entryId: number,
): Promise<Result<CustomDaoMetadata, CustomDataError>> {
  return await processMetadata(CUSTOM_METADATA_SCHEMA, url, entryId, "dao");
}

export async function fetchCustomMetadata(
  kind: "proposal" | "dao",
  entryId: number,
  metadataField: string,
): Promise<Result<CustomMetadata, CustomDataError>> {
  const r = parseIpfsUri(metadataField);

  return await match(r)({
    async Ok(cid) {
      const url = buildIpfsGatewayUrl(cid); // this is wrong
      const metadata =
        kind == "proposal"
          ? await processProposalMetadata(url, entryId)
          : await processDaoMetadata(url, entryId);
      return metadata;
    },
    // eslint-disable-next-line @typescript-eslint/require-await
    async Err({ message }) {
      return appendErrorInfo(message, `for ${kind} ${entryId}`);
    },
  });
}
