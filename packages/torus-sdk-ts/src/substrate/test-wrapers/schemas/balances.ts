import { z } from 'zod';
import {
  sb_amount,
  sb_address,
} from "./common";

// Account data schema - based on PalletBalancesAccountData
export const ACCOUNT_DATA_SCHEMA = z.object({
  free: sb_amount,
  reserved: sb_amount,
  frozen: sb_amount,
  flags: z.object({
    // AccountFlags structure
    value: z.number(),
  }),
});

// Balance lock schema - based on PalletBalancesBalanceLock
export const BALANCE_LOCK_SCHEMA = z.object({
  id: z.array(z.number()), // LockIdentifier (8 bytes)
  amount: sb_amount,
  reasons: z.enum(['Fee', 'Misc', 'All']),
});

// Reserve data schema - based on PalletBalancesReserveData
export const RESERVE_DATA_SCHEMA = z.object({
  id: z.array(z.number()), // ReserveIdentifier (8 bytes)
  amount: sb_amount,
});

export { sb_amount, sb_address };
