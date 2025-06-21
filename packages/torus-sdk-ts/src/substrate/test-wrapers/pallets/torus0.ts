import { createStorageValue } from '../core/storage-value';
import { createStorageMap } from '../core/storage-map';
import { 
  sb_amount, 
  sb_block_number, 
  sb_percentage, 
  sb_address, 
  sb_u16,
  AGENT_SCHEMA,
} from '../schemas/torus0';

export const torus0Storages = {
  // Simple value storages
  totalStake: createStorageValue('torus0', 'totalStake', sb_amount),
  agentUpdateCooldown: createStorageValue('torus0', 'agentUpdateCooldown', sb_block_number),
  burn: createStorageValue('torus0', 'burn', sb_amount),
  dividendsParticipationWeight: createStorageValue('torus0', 'dividendsParticipationWeight', sb_percentage),
  immunityPeriod: createStorageValue('torus0', 'immunityPeriod', sb_u16),
  maxAgentUrlLength: createStorageValue('torus0', 'maxAgentUrlLength', sb_u16),
  maxAllowedAgents: createStorageValue('torus0', 'maxAllowedAgents', sb_u16),
  maxAllowedValidators: createStorageValue('torus0', 'maxAllowedValidators', sb_u16),
  maxNameLength: createStorageValue('torus0', 'maxNameLength', sb_u16),
  maxRegistrationsPerBlock: createStorageValue('torus0', 'maxRegistrationsPerBlock', sb_u16),
  minAllowedStake: createStorageValue('torus0', 'minAllowedStake', sb_amount),
  minNameLength: createStorageValue('torus0', 'minNameLength', sb_u16),
  minValidatorStake: createStorageValue('torus0', 'minValidatorStake', sb_amount),
  registrationsThisBlock: createStorageValue('torus0', 'registrationsThisBlock', sb_u16),
  registrationsThisInterval: createStorageValue('torus0', 'registrationsThisInterval', sb_u16),
  rewardInterval: createStorageValue('torus0', 'rewardInterval', sb_u16),
  
  // Map storages
  agents: createStorageMap('torus0', 'agents', sb_address, AGENT_SCHEMA),
  // Note: These are double maps, need createStorageDoubleMap instead
  // stakedBy: createStorageMap('torus0', 'stakedBy', sb_address, sb_some(sb_amount)),
  // stakingTo: createStorageMap('torus0', 'stakingTo', sb_address, sb_some(sb_amount)),
} as const;

// Type for the router
export type Torus0StorageRouter = typeof torus0Storages;