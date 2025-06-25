import { createStorageValue } from '../core/storage-value';
import { createStorageMap } from '../core/storage-map';
import { 
  sb_percentage,
  sb_address, 
  sb_u32,
  sb_u64,
  PROPOSAL_SCHEMA,
  AGENT_APPLICATION_SCHEMA,
  GOVERNANCE_CONFIG_SCHEMA
} from '../schemas/governance';
import { sb_null } from '@torus-network/sdk/types';


export const governanceStorages = {
  // Governance pallet value storages
  daoTreasuryAddress: createStorageValue('governance', 'daoTreasuryAddress', sb_address),
  treasuryEmissionFee: createStorageValue('governance', 'treasuryEmissionFee', sb_percentage),
  globalGovernanceConfig: createStorageValue('governance', 'globalGovernanceConfig', GOVERNANCE_CONFIG_SCHEMA),
  
  // Map storages
  agentApplications: createStorageMap('governance', 'agentApplications', sb_u32, AGENT_APPLICATION_SCHEMA),
  allocators: createStorageMap('governance', 'allocators', sb_address, sb_null),
  proposals: createStorageMap('governance', 'proposals', sb_u64, PROPOSAL_SCHEMA),
  whitelist: createStorageMap('governance', 'whitelist', sb_address, sb_null),
} as const;

export type GovernanceStorageRouter = typeof governanceStorages;