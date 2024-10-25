import type { NetworkSubnetConfig, SubspaceModule } from "@commune-ts/types";

import type { Module, Subnet } from "./index.js";

export function SubspaceModuleToDatabase(
  module: SubspaceModule,
  atBlock: number,
  whitelisted: boolean,
): Module {
  return {
    netuid: module.netuid,
    moduleKey: module.key,
    atBlock: atBlock,
    name: module.name ?? null,
    registrationBlock: module.registrationBlock ?? null,
    addressUri: module.address ?? null,
    metadataUri: module.metadata ?? null,
    emission: module.emission ?? null,
    incentive: module.incentive ?? null,
    dividend: module.dividends ?? null,
    delegationFee: module.delegationFee ?? null,
    totalStaked: module.totalStaked,
    totalStakers: module.totalStakers,
    moduleId: module.uid,
    isWhitelisted: whitelisted,
  };
}

export function SubnetToDatabase(
  subnet: NetworkSubnetConfig,
  atBlock: number,
): Subnet {
  return {
    netuid: subnet.netuid,
    name: subnet.subnetNames,
    immunityPeriod: subnet.immunityPeriod,
    minAllowedWeights: subnet.minAllowedWeights,
    maxAllowedWeights: subnet.maxAllowedWeights,
    tempo: subnet.tempo,
    maxAllowedUids: subnet.maxAllowedUids,
    founder: subnet.founder,
    founderShare: subnet.founderShare,
    incentiveRatio: subnet.incentiveRatio,
    trustRatio: subnet.trustRatio,
    maxWeightAge: subnet.maxWeightAge,
    bondsMa: subnet.bondsMovingAverage ?? null,
    maximumSetWeightCallsPerEpoch: subnet.maximumSetWeightCallsPerEpoch ?? null,
    minValidatorStake: subnet.minValidatorStake,
    maxAllowedValidators: subnet.maxAllowedValidators ?? null,
    subnetMetadata: subnet.subnetMetadata,
    minBurn: subnet.moduleBurnConfig.minBurn,
    maxBurn: subnet.moduleBurnConfig.maxBurn,
    adjustmentAlpha: subnet.moduleBurnConfig.adjustmentAlpha,
    targetRegistrationsInterval:
      subnet.moduleBurnConfig.targetRegistrationsInterval,
    maxRegistrationsPerInterval:
      subnet.moduleBurnConfig.maxRegistrationsPerInterval,
    proposalCost: subnet.subnetGovernanceConfig.proposalCost,
    proposalExpiration: subnet.subnetGovernanceConfig.proposalExpiration,
    maxProposalRewardTreasuryAllocation:
      subnet.subnetGovernanceConfig.maxProposalRewardTreasuryAllocation,
    proposalRewardTreasuryAllocation:
      subnet.subnetGovernanceConfig.proposalRewardTreasuryAllocation,
    proposalRewardInterval:
      subnet.subnetGovernanceConfig.proposalRewardInterval,
    targetRegistrationsPerInterval:
      subnet.moduleBurnConfig.targetRegistrationsPerInterval,
    subnetEmission: subnet.subnetEmission,
    atBlock: atBlock,
    voteMode: subnet.subnetGovernanceConfig.voteMode,
  };
}
