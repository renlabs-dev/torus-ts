import { sb_to_primitive, sb_address_flexible, sb_account_enum } from "../../../types/zod.js";
import { createStorageMap } from "../core/storage-map.js";
import { createStorageValue } from "../core/storage-value.js";
import {
  AGENT_SCHEMA,
  BURN_CONFIG_UPDATED_SCHEMA,
  FEE_CONSTRAINTS_SCHEMA,
  NAMESPACE_PRICING_CONFIG_SCHEMA,
  PALLET_VERSION_SCHEMA,
  sb_address,
  sb_amount,
  sb_block_number,
  sb_percentage,
  sb_u16_substrate,
} from "../schemas/torus0.js";

export const torus0Storages = {
  // Simple value storages
  totalStake: createStorageValue('torus0', 'totalStake', sb_amount),
  agentUpdateCooldown: createStorageValue('torus0', 'agentUpdateCooldown', sb_block_number),
  burn: createStorageValue('torus0', 'burn', sb_amount),
  dividendsParticipationWeight: createStorageValue('torus0', 'dividendsParticipationWeight', sb_percentage),
  maxAgentUrlLength: createStorageValue('torus0', 'maxAgentUrlLength', sb_u16_substrate),
  maxAllowedValidators: createStorageValue('torus0', 'maxAllowedValidators', sb_u16_substrate),
  maxNameLength: createStorageValue('torus0', 'maxNameLength', sb_u16_substrate),
  maxRegistrationsPerBlock: createStorageValue('torus0', 'maxRegistrationsPerBlock', sb_u16_substrate),
  minAllowedStake: createStorageValue('torus0', 'minAllowedStake', sb_amount),
  minNameLength: createStorageValue('torus0', 'minNameLength', sb_u16_substrate),
  minValidatorStake: createStorageValue('torus0', 'minValidatorStake', sb_amount),
  registrationsThisBlock: createStorageValue('torus0', 'registrationsThisBlock', sb_u16_substrate),
  registrationsThisInterval: createStorageValue('torus0', 'registrationsThisInterval', sb_u16_substrate),
  rewardInterval: createStorageValue('torus0', 'rewardInterval', sb_u16_substrate),
  
  // Additional value storages discovered from blockchain
  burnConfig: createStorageValue('torus0', 'burnConfig', BURN_CONFIG_UPDATED_SCHEMA),
  feeConstraints: createStorageValue('torus0', 'feeConstraints', FEE_CONSTRAINTS_SCHEMA),
  namespacePricingConfig: createStorageValue('torus0', 'namespacePricingConfig', NAMESPACE_PRICING_CONFIG_SCHEMA),
  palletVersion: createStorageValue('torus0', 'palletVersion', PALLET_VERSION_SCHEMA),
  
  // Map storages  
  agents: createStorageMap('torus0', 'agents', sb_address_flexible, sb_to_primitive), // Use sb_to_primitive for substrate objects
  namespaceCount: createStorageMap('torus0', 'namespaceCount', sb_account_enum, sb_to_primitive), // Map: Account enum -> u32 (handle Lookup62 enum type)
  namespaces: createStorageMap('torus0', 'namespaces', sb_account_enum, sb_to_primitive), // Map but no data currently
  
  // Double map storages (currently commented out as they need createStorageDoubleMap)
  // stakedBy: AccountId32 -> AccountId32 -> Balance (36 entries found)
  // stakingTo: AccountId32 -> AccountId32 -> Balance (36 entries found)
  // These return hex amounts like: 0x00000000000000004563918244f40000
} as const;

// Type for the router
export type Torus0StorageRouter = typeof torus0Storages;