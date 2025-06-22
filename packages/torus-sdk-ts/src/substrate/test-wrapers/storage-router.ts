import { torus0Storages } from './pallets/torus0';
import { systemStorages } from './pallets/system';
import { balancesStorages } from './pallets/balances';
import { governanceStorages } from './pallets/governance';
import type { ApiPromise } from '@polkadot/api';

export const createStorageRouter = (api: ApiPromise) => {
  return {
    torus0: {
      // Simple value storages
      agentUpdateCooldown: torus0Storages.agentUpdateCooldown.query(api),
      burn: torus0Storages.burn.query(api),
      burnConfig: torus0Storages.burnConfig.query(api),
      dividendsParticipationWeight: torus0Storages.dividendsParticipationWeight.query(api),
      feeConstraints: torus0Storages.feeConstraints.query(api),
      maxAgentUrlLength: torus0Storages.maxAgentUrlLength.query(api),
      maxAllowedValidators: torus0Storages.maxAllowedValidators.query(api),
      maxNameLength: torus0Storages.maxNameLength.query(api),
      maxRegistrationsPerBlock: torus0Storages.maxRegistrationsPerBlock.query(api),
      minAllowedStake: torus0Storages.minAllowedStake.query(api),
      minNameLength: torus0Storages.minNameLength.query(api),
      minValidatorStake: torus0Storages.minValidatorStake.query(api),
      namespacePricingConfig: torus0Storages.namespacePricingConfig.query(api),
      palletVersion: torus0Storages.palletVersion.query(api),
      registrationsThisBlock: torus0Storages.registrationsThisBlock.query(api),
      registrationsThisInterval: torus0Storages.registrationsThisInterval.query(api),
      rewardInterval: torus0Storages.rewardInterval.query(api),
      totalStake: torus0Storages.totalStake.query(api),
      
      // Map storages
      agents: torus0Storages.agents.query(api),
      namespaceCount: torus0Storages.namespaceCount.query(api),
      namespaces: torus0Storages.namespaces.query(api),
      
      // TODO: Double map storages (need createStorageDoubleMap)
      // stakedBy: torus0Storages.stakedBy.query(api),
      // stakingTo: torus0Storages.stakingTo.query(api),
    },
    system: {
      // Simple value storages
      number: systemStorages.number.query(api),
      parentHash: systemStorages.parentHash.query(api),
      digest: systemStorages.digest.query(api),
      eventCount: systemStorages.eventCount.query(api),
      events: systemStorages.events.query(api),
      inherentsApplied: systemStorages.inherentsApplied.query(api),
      lastRuntimeUpgrade: systemStorages.lastRuntimeUpgrade.query(api),
      blockWeight: systemStorages.blockWeight.query(api),
      palletVersion: systemStorages.palletVersion.query(api),
      upgradedToTripleRefCount: systemStorages.upgradedToTripleRefCount.query(api),
      upgradedToU32RefCount: systemStorages.upgradedToU32RefCount.query(api),
      
      // Optional value storages
      allExtrinsicsLen: systemStorages.allExtrinsicsLen.query(api),
      authorizedUpgrade: systemStorages.authorizedUpgrade.query(api),
      executionPhase: systemStorages.executionPhase.query(api),
      extrinsicCount: systemStorages.extrinsicCount.query(api),
      
      // Map storages
      account: systemStorages.account.query(api),
      blockHash: systemStorages.blockHash.query(api),
      eventTopics: systemStorages.eventTopics.query(api),
      extrinsicData: systemStorages.extrinsicData.query(api),
    },
    balances: {
      // Simple value storages
      totalIssuance: balancesStorages.totalIssuance.query(api),
      inactiveIssuance: balancesStorages.inactiveIssuance.query(api),
      palletVersion: balancesStorages.palletVersion.query(api),
      
      // Map storages
      account: balancesStorages.account.query(api),
      locks: balancesStorages.locks.query(api),
      reserves: balancesStorages.reserves.query(api),
      freezes: balancesStorages.freezes.query(api),
      holds: balancesStorages.holds.query(api),
    },
    governance: {
      daoTreasuryAddress: governanceStorages.daoTreasuryAddress.query(api),
      treasuryEmissionFee: governanceStorages.treasuryEmissionFee.query(api),
      agentApplications: governanceStorages.agentApplications.query(api),
      allocators: governanceStorages.allocators.query(api),
      proposals: governanceStorages.proposals.query(api),
      whitelist: governanceStorages.whitelist.query(api),
    },
  } as const;
};

export type StorageRouter = ReturnType<typeof createStorageRouter>;