/* eslint-disable @typescript-eslint/no-non-null-assertion */
import "@polkadot/api/augment";

import type { z } from "zod";
import { ApiPromise, Keyring } from "@polkadot/api";
import { encodeAddress } from "@polkadot/util-crypto";
import SuperJSON from "superjson";
import { assert } from "tsafe";

import type { SS58Address } from "../address";
import type {
  Api,
  LastBlock,
  NetworkSubnetConfig,
  StakeFromData,
  StakeOutData,
  SubspaceModule,
  VoteWithStake,
} from "../old_types";
import type {
  ChainEntry,
  SubspacePalletName,
  SubspaceStorageName,
} from "../old_utils";
import { checkSS58, isSS58 } from "../address";
import {
  GOVERNANCE_CONFIG_SCHEMA,
  MODULE_BURN_CONFIG_SCHEMA,
  NetworkSubnetConfigSchema,
  STAKE_DATA_SCHEMA,
  STAKE_FROM_SCHEMA,
  SUBSPACE_MODULE_SCHEMA,
} from "../old_types";
import { getPropsToMap, standardizeUidToSS58address } from "../old_utils";
import { sb_blocks } from "../types";
import {
  sb_address,
  sb_array,
  sb_basic_enum,
  sb_bigint,
  sb_struct,
} from "../types/zod";

export {
  queryProposals,
  queryDaoApplications as queryDaosEntries, // TODO: rename
} from "../modules/governance";

export { ApiPromise };

export async function queryLastBlock(api: ApiPromise): Promise<LastBlock> {
  const blockHeader = await api.rpc.chain.getHeader();
  const blockNumber = sb_blocks.parse(blockHeader.number);
  const blockHash = blockHeader.hash;
  const blockHashHex = blockHash.toHex();
  const apiAtBlock = await api.at(blockHeader.hash);
  return {
    blockHeader,
    blockNumber,
    blockHash,
    blockHashHex,
    apiAtBlock,
  };
}

export async function queryBalance(api: Api, address: SS58Address | string) {
  if (!isSS58(address)) {
    throw new Error("Invalid address format, expected SS58");
  }
  const {
    data: { free: freeBalance },
  } = await api.query.system.account(address);
  return BigInt(freeBalance.toString());
}

export async function pushToWhitelist(
  api: ApiPromise,
  moduleKey: SS58Address,
  mnemonic: string | undefined,
) {
  const keyring = new Keyring({ type: "sr25519" });

  if (!mnemonic) {
    throw new Error("No sudo mnemonic provided");
  }
  const sudoKeypair = keyring.addFromUri(mnemonic);
  const accountId = encodeAddress(moduleKey, 42);

  const tx = api.tx.governanceModule.addToWhitelist(accountId);

  const extrinsic = await tx
    .signAndSend(sudoKeypair)
    .catch((err) => {
      console.error(err);
      return false;
    })
    .then(() => {
      console.log(`Extrinsic: ${extrinsic}`);
      return true;
    });
}

export async function queryWhitelist(api: Api): Promise<SS58Address[]> {
  const whitelist = [];

  const entries = await api.query.governanceModule.legitWhitelist.entries();
  for (const [keys, _value] of entries) {
    assert(keys.args[0]);
    const key = keys.args[0].toPrimitive();
    assert(typeof key === "string");
    const address = checkSS58(key);
    whitelist.push(address);
  }

  return whitelist;
}

export async function removeFromWhitelist(
  api: ApiPromise,
  moduleKey: SS58Address,
  mnemonic: string | undefined,
) {
  if (!mnemonic) {
    throw new Error("No sudo mnemonic provided");
  }

  const accountId = encodeAddress(moduleKey, 42);
  const tx = api.tx.governanceModule.removeFromWhitelist(accountId);

  const keyring = new Keyring({ type: "sr25519" });
  const sudoKeypair = keyring.addFromUri(mnemonic);
  const extrinsic = await tx
    .signAndSend(sudoKeypair)
    .catch((err) => {
      console.error(err);
      return false;
    })
    .then(() => {
      console.log(`Extrinsic: ${extrinsic}`);
      return true;
    });
}

export async function refuseDaoApplication(
  api: ApiPromise,
  proposalId: number,
  mnemonic: string | undefined,
) {
  if (!mnemonic) {
    throw new Error("No sudo mnemonic provided");
  }

  const tx = api.tx.governanceModule.refuseDaoApplication(proposalId);

  const keyring = new Keyring({ type: "sr25519" });
  const sudoKeypair = keyring.addFromUri(mnemonic);
  const extrinsic = await tx
    .signAndSend(sudoKeypair)
    .catch((err) => {
      console.error(err);
      return false;
    })
    .then(() => {
      console.log(`Extrinsic: ${extrinsic}`);
      return true;
    });

  return true;
}

export async function queryDaoTreasuryAddress(api: Api) {
  const addr = await api.query.governanceModule.daoTreasuryAddress();
  return checkSS58(addr.toString());
}

export async function queryUnrewardedProposals(api: Api): Promise<number[]> {
  const unrewardedProposals =
    await api.query.governanceModule.unrewardedProposals.entries();

  return unrewardedProposals
    .map(([key]) => {
      // The key is a StorageKey, which contains the proposal ID
      // We need to extract the proposal ID from this key and convert it to a number
      const proposalId = key.args[0].toString();
      return proposalId ? parseInt(proposalId, 10) : NaN;
    })
    .filter((id): id is number => !isNaN(id));
}

const GOVERNANCE_CONFIGURATION_SCHEMA = sb_struct({
  proposalCost: sb_bigint,
  proposalExpiration: sb_bigint,
  voteMode: sb_basic_enum(["Vote", "Authority"]),
  proposalRewardTreasuryAllocation: sb_bigint,
  maxProposalRewardTreasuryAllocation: sb_bigint,
  proposalRewardInterval: sb_bigint,
});

type GovernanceConfiguration = z.infer<typeof GOVERNANCE_CONFIGURATION_SCHEMA>;

export async function queryGlobalGovernanceConfig(
  api: Api,
): Promise<GovernanceConfiguration> {
  const config = await api.query.governanceModule.globalGovernanceConfig();
  const parsed_config = GOVERNANCE_CONFIGURATION_SCHEMA.parse(config);
  return parsed_config;
}

export function getRewardAllocation(
  governanceConfig: GovernanceConfiguration,
  treasuryBalance: bigint,
) {
  const allocationPercentage =
    governanceConfig.proposalRewardTreasuryAllocation;
  const maxAllocation = governanceConfig.maxProposalRewardTreasuryAllocation;

  let allocation = (treasuryBalance * allocationPercentage) / 100n;

  if (allocation > maxAllocation) allocation = maxAllocation;

  // Here there is a "decay" calculation for the n-th proposal reward that
  // we are ignoring, as we want only the first.

  return allocation;
}

export async function queryRewardAllocation(api: Api): Promise<bigint> {
  const treasury_address = await queryDaoTreasuryAddress(api);
  const balance = await queryBalance(api, treasury_address);
  const governanceConfig = await queryGlobalGovernanceConfig(api);
  return getRewardAllocation(governanceConfig, balance);
}

const NOT_DELEGATING_VOTING_POWER_SCHEMA = sb_array(sb_address);

export async function queryNotDelegatingVotingPower(
  api: Api,
): Promise<SS58Address[]> {
  const value = await api.query.governanceModule.notDelegatingVotingPower();
  return NOT_DELEGATING_VOTING_POWER_SCHEMA.parse(value);
}

export async function queryStakeOut(
  torusCacheUrl: string,
): Promise<StakeOutData> {
  const response = await fetch(`${torusCacheUrl}/api/stake-out`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch data");
  }

  const responseData = await response.text();
  const parsedData = SuperJSON.parse(responseData);
  const stakeOutData = STAKE_DATA_SCHEMA.parse(parsedData);

  return stakeOutData;
}

export async function queryCalculateStakeOut(api: Api) {
  // StakeTo is the list of keys that have staked to that key.
  const stakeToQuery = await api.query.subspaceModule.stakeTo.entries();

  let total = 0n;
  const perAddr = new Map<string, bigint>();

  for (const [keyRaw, valueRaw] of stakeToQuery) {
    const [fromAddrRaw] = keyRaw.args;
    const fromAddr = fromAddrRaw.toString();

    const staked = BigInt(valueRaw.toString());

    total += staked;
    perAddr.set(fromAddr, (perAddr.get(fromAddr) ?? 0n) + staked);
  }

  return {
    total,
    perAddr,
  };
}

export async function queryStakeFrom(
  torusCacheUrl: string,
): Promise<StakeFromData> {
  const response = await fetch(`${torusCacheUrl}/api/stake-from`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch data");
  }

  const responseData = await response.text();
  const parsedData = SuperJSON.parse(responseData);
  const stakeFromData = STAKE_DATA_SCHEMA.parse(parsedData);

  return stakeFromData;
}

export async function queryCalculateStakeFrom(api: Api) {
  // StakeFrom is the list of nominators that have staked to a validator.
  const stakeFromQuery = await api.query.subspaceModule.stakeFrom.entries();

  let total = 0n;
  const perAddr = new Map<string, bigint>();

  for (const [keyRaw, valueRaw] of stakeFromQuery) {
    const [toAddrRaw, _fromAddrRaw] = keyRaw.args;
    const toAddr = toAddrRaw.toString();

    const staked = BigInt(valueRaw.toString());

    total += staked;
    perAddr.set(toAddr, (perAddr.get(toAddr) ?? 0n) + staked);
  }

  return {
    total,
    perAddr,
  };
}

export async function processVotesAndStakes(
  api: Api,
  torusCacheUrl: string,
  votesFor: SS58Address[],
  votesAgainst: SS58Address[],
): Promise<VoteWithStake[]> {
  // Get addresses not delegating voting power and get stake information
  const [notDelegatingAddresses, stakeFrom, stakeOut] = await Promise.all([
    queryNotDelegatingVotingPower(api),
    queryStakeFrom(torusCacheUrl),
    queryStakeOut(torusCacheUrl),
  ]);

  const notDelegatingSet = new Set(notDelegatingAddresses);

  const stakeOutMap = new Map(
    Object.entries(stakeOut.perAddr).map(([key, value]) => [
      key,
      BigInt(value),
    ]),
  );

  const stakeFromMap = new Map(
    Object.entries(stakeFrom.perAddr).map(([key, value]) => [
      key,
      BigInt(value),
    ]),
  );

  // Pre-calculate total stake for each address
  const totalStakeMap = new Map<SS58Address, bigint>();
  const allAddresses = new Set([...votesFor, ...votesAgainst]);

  for (const address of allAddresses) {
    const stakeFrom = stakeFromMap.get(address) ?? 0n;
    const stakeOut = stakeOutMap.get(address) ?? 0n;

    const totalStake =
      stakeOut > 0n && !notDelegatingSet.has(address)
        ? 0n
        : stakeFrom + stakeOut;
    totalStakeMap.set(address, totalStake);
  }

  // Process all votes and push it to an array to avoid spread
  const processedVotes: VoteWithStake[] = [];
  votesFor.map((address) => {
    processedVotes.push({
      address,
      stake: totalStakeMap.get(address) ?? 0n,
      vote: "In Favor" as const,
    });
  });

  votesAgainst.map((address) => {
    processedVotes.push({
      address,
      stake: totalStakeMap.get(address) ?? 0n,
      vote: "Against" as const,
    });
  });

  // Sort the processed votes
  const sortedVotes = processedVotes.sort((a, b) => Number(b.stake - a.stake));
  return sortedVotes;
}

// TODO: rename `queryUserTotalStaked`, it's not adding up the stakes, so it's not a total
export async function queryUserTotalStaked(
  api: Api,
  address: SS58Address | string,
) {
  const stakeEntries = await api.query.subspaceModule.stakeTo.entries(address);

  const stakes = stakeEntries.map(([key, value]) => {
    const [, stakeToAddress] = key.args;
    const stake = BigInt(value.toString());

    return {
      address: stakeToAddress.toString(),
      stake,
    };
  });

  return stakes.filter((stake) => stake.stake !== 0n);
}

export async function querySubnetParams(
  api: Api,
): Promise<NetworkSubnetConfig[]> {
  const subnetProps: SubspaceStorageName[] = [
    "subnetNames",
    "immunityPeriod",
    "minAllowedWeights",
    "maxAllowedWeights",
    "tempo",
    "maxAllowedUids",
    "founder",
    "founderShare",
    "incentiveRatio",
    "trustRatio",
    "maxWeightAge",
    "bondsMovingAverage",
    "maximumSetWeightCallsPerEpoch",
    "minValidatorStake",
    "maxAllowedValidators",
    "moduleBurnConfig",
    "subnetMetadata",
  ];
  const props: Record<SubspacePalletName, SubspaceStorageName[]> = {
    subspaceModule: subnetProps,
    subnetEmissionModule: ["subnetEmission"],
    governanceModule: ["subnetGovernanceConfig"],
  } as Record<SubspacePalletName, SubspaceStorageName[]>;
  const subnetInfo = await queryChain(api, props);
  const subnetNames = subnetInfo.subnetNames;

  const subnets: NetworkSubnetConfig[] = [];
  for (const [netuid, _] of Object.entries(subnetNames)) {
    const subnet: NetworkSubnetConfig = NetworkSubnetConfigSchema.parse({
      subnetNames: subnetInfo.subnetNames[netuid]!,
      immunityPeriod: subnetInfo.immunityPeriod[netuid]!,
      minAllowedWeights: subnetInfo.minAllowedWeights[netuid]!,
      maxAllowedWeights: subnetInfo.maxAllowedWeights[netuid]!,
      tempo: subnetInfo.tempo[netuid]!,
      maxAllowedUids: subnetInfo.maxAllowedUids[netuid]!,
      founder: subnetInfo.founder[netuid]!,
      founderShare: subnetInfo.founderShare[netuid]!,
      incentiveRatio: subnetInfo.incentiveRatio[netuid]!,
      trustRatio: subnetInfo.trustRatio[netuid]!,
      maxWeightAge: subnetInfo.maxWeightAge[netuid]!,
      bondsMovingAverage: subnetInfo.bondsMovingAverage[netuid],
      maximumSetWeightCallsPerEpoch:
        subnetInfo.maximumSetWeightCallsPerEpoch[netuid],
      minValidatorStake: subnetInfo.minValidatorStake[netuid]!,
      maxAllowedValidators: subnetInfo.maxAllowedValidators[netuid],
      moduleBurnConfig: MODULE_BURN_CONFIG_SCHEMA.parse(
        subnetInfo.moduleBurnConfig[netuid],
      ),
      subnetMetadata: subnetInfo.subnetMetadata[netuid],
      netuid: netuid,
      subnetGovernanceConfig: GOVERNANCE_CONFIG_SCHEMA.parse(
        subnetInfo.subnetGovernanceConfig[netuid],
      ),
      subnetEmission: subnetInfo.subnetEmission[netuid],
    });
    subnets.push(subnet);
  }
  return subnets;
}

export function keyStakeFrom(
  targetKey: SS58Address,
  stakeFromStorage: Map<SS58Address, Map<SS58Address, bigint>>,
) {
  const stakerMap = stakeFromStorage.get(targetKey);
  let totalStake = 0n;
  if (stakerMap === undefined) {
    console.warn("Could not StakeFrom map for key: ", targetKey);
    return totalStake;
  }
  for (const stake of stakerMap.values()) {
    totalStake += stake;
  }
  return totalStake;
}

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
      totalStaked: keyStakeFrom(
        moduleKey,
        parsedStakeFromStorage.stakeFromStorage,
      ),
      totalStakers:
        parsedStakeFromStorage.stakeFromStorage.get(moduleKey)?.size ?? 0,
    });
    moduleMap.push(module);
  }
  return moduleMap;
}

/**
 * enriches the modules fetching the properties in `props`
 *
 * @returns the same moduleMap passed as argument
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
