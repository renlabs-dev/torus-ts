import { sb_null, sb_to_primitive } from "@torus-network/sdk/types";

import { createStorageMap } from "../core/storage-map.js";
import { createStorageValue } from "../core/storage-value.js";
import {
  AGENT_APPLICATION_SCHEMA,
  GOVERNANCE_CONFIG_SCHEMA,
  PROPOSAL_SCHEMA,
  sb_address,
  sb_percentage,
  sb_u32,
  sb_u64,
} from "../schemas/governance.js";

export const governanceStorages = {
  // Governance pallet value storages
  daoTreasuryAddress: createStorageValue('governance', 'daoTreasuryAddress', sb_address),
  treasuryEmissionFee: createStorageValue('governance', 'treasuryEmissionFee', sb_percentage),
  globalGovernanceConfig: createStorageValue('governance', 'globalGovernanceConfig', GOVERNANCE_CONFIG_SCHEMA),
  
  // Map storages
  agentApplications: createStorageMap('governance', 'agentApplications', sb_u32, sb_to_primitive), // Use sb_to_primitive for substrate objects
  allocators: createStorageMap('governance', 'allocators', sb_address, sb_null),
  proposals: createStorageMap('governance', 'proposals', sb_u64, sb_to_primitive), // Use sb_to_primitive for substrate objects
  whitelist: createStorageMap('governance', 'whitelist', sb_address, sb_null),
} as const;

export type GovernanceStorageRouter = typeof governanceStorages;