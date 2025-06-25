import { createStorageValue } from '../core/storage-value';
import { createStorageMap } from '../core/storage-map';
import { 
  sb_blocks,
  sb_number_int,
  sb_address,
  sb_boolean,
  sb_hash,
  sb_optional_number,
  sb_optional_any,
  ACCOUNT_INFO_SCHEMA,
  BLOCK_WEIGHT_SCHEMA,
  DIGEST_SCHEMA,
  EVENT_SCHEMA,
  LAST_RUNTIME_UPGRADE_SCHEMA,
} from '../schemas/system';
import { z } from 'zod';
import { sb_to_primitive } from '../../../types/zod';

export const systemStorages = {
  // Simple value storages
  number: createStorageValue('system', 'number', sb_number_int), // Current block number
  parentHash: createStorageValue('system', 'parentHash', sb_hash), // Hash of parent block
  digest: createStorageValue('system', 'digest', DIGEST_SCHEMA), // Block digest with logs
  eventCount: createStorageValue('system', 'eventCount', sb_number_int), // Number of events
  events: createStorageValue('system', 'events', EVENT_SCHEMA), // Events in current block
  inherentsApplied: createStorageValue('system', 'inherentsApplied', sb_boolean), // Inherents applied flag
  lastRuntimeUpgrade: createStorageValue('system', 'lastRuntimeUpgrade', LAST_RUNTIME_UPGRADE_SCHEMA), // Last runtime upgrade info
  blockWeight: createStorageValue('system', 'blockWeight', BLOCK_WEIGHT_SCHEMA), // Current block weight
  palletVersion: createStorageValue('system', 'palletVersion', sb_number_int), // System pallet version
  upgradedToTripleRefCount: createStorageValue('system', 'upgradedToTripleRefCount', sb_boolean), // Upgrade flag
  upgradedToU32RefCount: createStorageValue('system', 'upgradedToU32RefCount', sb_boolean), // Upgrade flag
  
  // Optional value storages (can be null)
  allExtrinsicsLen: createStorageValue('system', 'allExtrinsicsLen', sb_optional_number), // Total extrinsics length
  authorizedUpgrade: createStorageValue('system', 'authorizedUpgrade', sb_optional_any), // Authorized upgrade
  executionPhase: createStorageValue('system', 'executionPhase', sb_optional_any), // Current execution phase
  extrinsicCount: createStorageValue('system', 'extrinsicCount', sb_optional_number), // Number of extrinsics
  
  // Map storages
  account: createStorageMap('system', 'account', sb_address, sb_to_primitive), // AccountId -> AccountInfo (use sb_to_primitive to handle map data)
  blockHash: createStorageMap('system', 'blockHash', sb_blocks, sb_hash), // BlockNumber -> Hash
  eventTopics: createStorageMap('system', 'eventTopics', sb_hash, sb_to_primitive), // Hash -> Vec<EventIndex>
  extrinsicData: createStorageMap('system', 'extrinsicData', sb_number_int, sb_to_primitive), // ExtrinsicIndex -> Vec<u8>
} as const;

export type SystemStorageRouter = typeof systemStorages;