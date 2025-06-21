import { createStorageValue } from '../core/storage-value';
import { createStorageMap } from '../core/storage-map';
import { 
  sb_amount, 
  sb_address, 
  ACCOUNT_DATA_SCHEMA,
  BALANCE_LOCK_SCHEMA,
  RESERVE_DATA_SCHEMA
} from '../schemas/balances';
import { z } from 'zod';

export const balancesStorages = {
  // Balances pallet value storages
  totalIssuance: createStorageValue('balances', 'totalIssuance', sb_amount),
  inactiveIssuance: createStorageValue('balances', 'inactiveIssuance', sb_amount),
  
  // Map storages
  account: createStorageMap('balances', 'account', sb_address, ACCOUNT_DATA_SCHEMA),
  locks: createStorageMap('balances', 'locks', sb_address, z.array(BALANCE_LOCK_SCHEMA)),
  reserves: createStorageMap('balances', 'reserves', sb_address, z.array(RESERVE_DATA_SCHEMA)),
} as const;

export type BalancesStorageRouter = typeof balancesStorages;