import { createStorageMap } from "../core/storage-map.js";
import { createStorageValue } from "../core/storage-value.js";
import {
  PALLET_BALANCES_ACCOUNT_DATA_SCHEMA,
  BALANCE_LOCKS_SCHEMA,
  FREEZES_SCHEMA,
  HOLDS_SCHEMA,
  RESERVES_SCHEMA,
  sb_address,
  sb_bigint,
  sb_number_int,
} from "../schemas/balances.js";

export const balancesStorages = {
  // Simple value storages
  totalIssuance: createStorageValue('balances', 'totalIssuance', sb_bigint), // Total token issuance
  inactiveIssuance: createStorageValue('balances', 'inactiveIssuance', sb_bigint), // Inactive issuance amount
  palletVersion: createStorageValue('balances', 'palletVersion', sb_number_int), // Balances pallet version
  
  // Map storages (all currently empty but ready for data)
  account: createStorageMap('balances', 'account', sb_address, PALLET_BALANCES_ACCOUNT_DATA_SCHEMA), // AccountId -> AccountData
  locks: createStorageMap('balances', 'locks', sb_address, BALANCE_LOCKS_SCHEMA), // AccountId -> Vec<BalanceLock>
  reserves: createStorageMap('balances', 'reserves', sb_address, RESERVES_SCHEMA), // AccountId -> Vec<ReserveData>
  freezes: createStorageMap('balances', 'freezes', sb_address, FREEZES_SCHEMA), // AccountId -> Vec<IdAmount>
  holds: createStorageMap('balances', 'holds', sb_address, HOLDS_SCHEMA), // AccountId -> Vec<IdAmount>
} as const;

export type BalancesStorageRouter = typeof balancesStorages;