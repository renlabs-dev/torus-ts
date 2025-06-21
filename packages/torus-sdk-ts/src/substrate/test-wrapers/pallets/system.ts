import { createStorageValue } from '../core/storage-value';
import { 
  DIGEST_SCHEMA
} from '../schemas/system';
import {
  sb_u64,
  sb_hash,
} from '../schemas/common';

export const systemStorages = {
  // System pallet value storages
  number: createStorageValue('system', 'number', sb_u64),
  parentHash: createStorageValue('system', 'parentHash', sb_hash),
  digest: createStorageValue('system', 'digest', DIGEST_SCHEMA),
  extrinsicsRoot: createStorageValue('system', 'extrinsicsRoot', sb_hash),
} as const;

export type SystemStorageRouter = typeof systemStorages;