import { sb_to_primitive, sb_array } from "../../../types/zod.js";
import { createStorageMap } from "../core/storage-map.js";
import { createStorageValue } from "../core/storage-value.js";
import {
  FRAME_SUPPORT_DISPATCH_PER_DISPATCH_CLASS_WEIGHT_SCHEMA,
  SP_RUNTIME_DIGEST_SCHEMA,
  EVENTS_SCHEMA,
  LAST_RUNTIME_UPGRADE_SCHEMA,
  FRAME_SYSTEM_ACCOUNT_INFO_SCHEMA,
  sb_address,
  sb_blocks,
  sb_bool,
  sb_h256,
  sb_number_int,
  sb_optional_number,
  sb_optional_string,
} from "../schemas/system.js";

export const systemStorages = {
  // Simple value storages
  number: createStorageValue('system', 'number', sb_number_int), // Current block number
  parentHash: createStorageValue('system', 'parentHash', sb_h256), // Hash of parent block
  digest: createStorageValue('system', 'digest', SP_RUNTIME_DIGEST_SCHEMA), // Block digest as hex string
  eventCount: createStorageValue('system', 'eventCount', sb_number_int), // Number of events
  events: createStorageValue('system', 'events', EVENTS_SCHEMA), // Events as array of hex strings
  inherentsApplied: createStorageValue('system', 'inherentsApplied', sb_bool), // Inherents applied flag
  lastRuntimeUpgrade: createStorageValue('system', 'lastRuntimeUpgrade', LAST_RUNTIME_UPGRADE_SCHEMA), // Last runtime upgrade as hex string
  blockWeight: createStorageValue('system', 'blockWeight', FRAME_SUPPORT_DISPATCH_PER_DISPATCH_CLASS_WEIGHT_SCHEMA), // Current block weight as hex string
  palletVersion: createStorageValue('system', 'palletVersion', sb_number_int), // System pallet version
  upgradedToTripleRefCount: createStorageValue('system', 'upgradedToTripleRefCount', sb_bool), // Upgrade flag
  upgradedToU32RefCount: createStorageValue('system', 'upgradedToU32RefCount', sb_bool), // Upgrade flag
  
  // Optional value storages (can be null)
  allExtrinsicsLen: createStorageValue('system', 'allExtrinsicsLen', sb_optional_number), // Total extrinsics length
  authorizedUpgrade: createStorageValue('system', 'authorizedUpgrade', sb_optional_string), // Authorized upgrade
  executionPhase: createStorageValue('system', 'executionPhase', sb_optional_string), // Current execution phase
  extrinsicCount: createStorageValue('system', 'extrinsicCount', sb_optional_number), // Number of extrinsics
  
  // Map storages
  account: createStorageMap('system', 'account', sb_address, FRAME_SYSTEM_ACCOUNT_INFO_SCHEMA), // AccountId -> AccountInfo as hex string
  blockHash: createStorageMap('system', 'blockHash', sb_blocks, sb_h256), // BlockNumber -> Hash
  eventTopics: createStorageMap('system', 'eventTopics', sb_h256, sb_to_primitive), // Hash -> Vec<EventIndex>
  extrinsicData: createStorageMap('system', 'extrinsicData', sb_number_int, sb_to_primitive), // ExtrinsicIndex -> Vec<u8>
} as const;

export type SystemStorageRouter = typeof systemStorages;