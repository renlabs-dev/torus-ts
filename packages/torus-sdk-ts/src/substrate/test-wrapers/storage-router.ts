import { torus0Storages } from './pallets/torus0';
import { systemStorages } from './pallets/system';
import { balancesStorages } from './pallets/balances';
import { governanceStorages } from './pallets/governance';
import type { ApiPromise } from '@polkadot/api';

export const createStorageRouter = (api: ApiPromise) => {
  return {
    torus0: {
      agentUpdateCooldown: torus0Storages.agentUpdateCooldown.query(api),
      agents: torus0Storages.agents.query(api),
      burn: torus0Storages.burn.query(api),
      //burnconfig
      dividendsParticipationWeight: torus0Storages.dividendsParticipationWeight.query(api),
      //feeConstraints
      //MaxAgentUrlLength
      maxAllowedValidators: torus0Storages.maxAllowedValidators.query(api),
      //maxNameLength
      //maxRegistrationPerBlock
      minAllowedStake: torus0Storages.minAllowedStake.query(api),
      //minNameLenght
      minValidatorStake: torus0Storages.minValidatorStake.query(api),
      //nameSpace Count
      //nameSpacePricingConfig
      //nameSpaces
      //palletVersion
      //RegistrationThisBlock
      //RegistrationThisInterval
      //StakedBy
      //StakingTo
      totalStake: torus0Storages.totalStake.query(api),

      // ToDO : Revise
      // immunityPeriod: torus0Storages.immunityPeriod.query(api),
      // maxAllowedAgents: torus0Storages.maxAllowedAgents.query(api),
      // rewardInterval: torus0Storages.rewardInterval.query(api),
    },
    system: {
      number: systemStorages.number.query(api),
      parentHash: systemStorages.parentHash.query(api),
      digest: systemStorages.digest.query(api),
      extrinsicsRoot: systemStorages.extrinsicsRoot.query(api),
    },
    balances: {
      totalIssuance: balancesStorages.totalIssuance.query(api),
      inactiveIssuance: balancesStorages.inactiveIssuance.query(api),
      account: balancesStorages.account.query(api),
      locks: balancesStorages.locks.query(api),
      reserves: balancesStorages.reserves.query(api),
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