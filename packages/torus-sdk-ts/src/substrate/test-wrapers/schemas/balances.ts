/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { z } from 'zod';
import {
  sb_amount,
  sb_address,
  sb_number_int,
} from "../../../types";

// Re-export shared schemas
export { sb_amount, sb_address, sb_number_int };

// Simple schemas for balances pallet
export const sb_hex_amount = z.any().transform((val) => {
  if (typeof val === 'string') return val;
  if (val && typeof val.toString === 'function') return val.toString();
  if (val && typeof val.toJSON === 'function') return val.toJSON();
  return String(val);
}); // Hex amounts from Substrate Balance codec

// Account data schema - use z.any() for complex structures since maps are empty
export const ACCOUNT_DATA_SCHEMA = z.any(); // PalletBalancesAccountData

// Balance lock schema - use z.any() for complex structures since maps are empty
export const BALANCE_LOCK_SCHEMA = z.any(); // Vec<PalletBalancesBalanceLock>

// Reserve data schema - use z.any() for complex structures since maps are empty  
export const RESERVE_DATA_SCHEMA = z.any(); // Vec<PalletBalancesReserveData>

// Freeze data schema - use z.any() for complex structures since maps are empty
export const FREEZE_DATA_SCHEMA = z.any(); // Vec<IdAmount>

// Hold data schema - use z.any() for complex structures since maps are empty
export const HOLD_DATA_SCHEMA = z.any(); // Vec<IdAmount>
