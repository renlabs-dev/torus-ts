import type { z } from "zod";

import {
  sb_address,
  sb_array,
  sb_basic_enum,
  sb_bigint,
  sb_number_int,
  sb_string,
  sb_struct,
} from "../../../types/index.js";

// Re-export shared schemas
export { sb_address, sb_bigint, sb_number_int };

// PalletBalancesAccountData schema - based on types-lookup.ts line 23-29
export const PALLET_BALANCES_ACCOUNT_DATA_SCHEMA = sb_struct({
  free: sb_bigint,      // u128
  reserved: sb_bigint,  // u128
  frozen: sb_bigint,    // u128
  flags: sb_bigint,     // u128
});

export type PalletBalancesAccountData = z.infer<typeof PALLET_BALANCES_ACCOUNT_DATA_SCHEMA>;

// Balance lock schema - PalletBalancesBalanceLock
export const BALANCE_LOCK_SCHEMA = sb_struct({
  id: sb_string,        // Lock identifier (usually 8 bytes as string)
  amount: sb_bigint,    // u128
  reasons: sb_basic_enum(['Fee', 'Misc', 'All'] as const), // LockReasons enum
});

export type BalanceLock = z.infer<typeof BALANCE_LOCK_SCHEMA>;

// Array of balance locks - Vec<PalletBalancesBalanceLock>
export const BALANCE_LOCKS_SCHEMA = sb_array(BALANCE_LOCK_SCHEMA);

// Reserve data schema - PalletBalancesReserveData
export const RESERVE_DATA_SCHEMA = sb_struct({
  id: sb_string,        // Reserve identifier
  amount: sb_bigint,    // u128
});

export type ReserveData = z.infer<typeof RESERVE_DATA_SCHEMA>;

// Array of reserve data - Vec<PalletBalancesReserveData>
export const RESERVES_SCHEMA = sb_array(RESERVE_DATA_SCHEMA);

// Freeze data schema - PalletBalancesIdAmount
export const FREEZE_DATA_SCHEMA = sb_struct({
  id: sb_string,        // Freeze identifier
  amount: sb_bigint,    // u128
});

export type FreezeData = z.infer<typeof FREEZE_DATA_SCHEMA>;

// Array of freeze data - Vec<PalletBalancesIdAmount>
export const FREEZES_SCHEMA = sb_array(FREEZE_DATA_SCHEMA);

// Hold data schema - PalletBalancesIdAmount  
export const HOLD_DATA_SCHEMA = sb_struct({
  id: sb_string,        // Hold identifier
  amount: sb_bigint,    // u128
});

export type HoldData = z.infer<typeof HOLD_DATA_SCHEMA>;

// Array of hold data - Vec<PalletBalancesIdAmount>
export const HOLDS_SCHEMA = sb_array(HOLD_DATA_SCHEMA);
