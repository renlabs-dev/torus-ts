import { createStorageMap } from "../core/storage-map.js";
import { createStorageValue } from "../core/storage-value.js";
import {
  ACCOUNT_DATA_SCHEMA,
  BALANCE_LOCK_SCHEMA,
  FREEZE_DATA_SCHEMA,
  HOLD_DATA_SCHEMA,
  RESERVE_DATA_SCHEMA,
  sb_address,
  sb_hex_amount,
  sb_number_int,
} from "../schemas/balances.js";

export const balancesStorages = {
  // Simple value storages
  totalIssuance: createStorageValue('balances', 'totalIssuance', sb_hex_amount), // Total token issuance as hex
  inactiveIssuance: createStorageValue('balances', 'inactiveIssuance', sb_number_int), // Inactive issuance amount
  palletVersion: createStorageValue('balances', 'palletVersion', sb_number_int), // Balances pallet version
  
  // Map storages (all currently empty but ready for data)
  account: createStorageMap('balances', 'account', sb_address, ACCOUNT_DATA_SCHEMA), // AccountId -> AccountData
  locks: createStorageMap('balances', 'locks', sb_address, BALANCE_LOCK_SCHEMA), // AccountId -> Vec<BalanceLock>
  reserves: createStorageMap('balances', 'reserves', sb_address, RESERVE_DATA_SCHEMA), // AccountId -> Vec<ReserveData>
  freezes: createStorageMap('balances', 'freezes', sb_address, FREEZE_DATA_SCHEMA), // AccountId -> Vec<IdAmount>
  holds: createStorageMap('balances', 'holds', sb_address, HOLD_DATA_SCHEMA), // AccountId -> Vec<IdAmount>
} as const;

export type BalancesStorageRouter = typeof balancesStorages;