import { z } from 'zod';
import {
  sb_amount,
  sb_blocks,
  sb_percent,
  sb_address,
  sb_some,
} from "../../../types";

// Shared base schemas used across multiple pallets
export { sb_amount, sb_address, sb_some };
export const sb_block_number = sb_blocks;
export const sb_percentage = sb_percent;

// Common numeric schemas
export const sb_u8 = z.number().int().min(0).max(255);
export const sb_u16 = z.number().int().min(0).max(65535);
export const sb_u32 = z.number().int().min(0).max(4294967295);
export const sb_u64 = z.number().int().min(0);
export const sb_u128 = z.number().int().min(0);

// Common hash and identifier schemas
export const sb_hash = z.string(); // For H256 hashes
export const sb_hash160 = z.string(); // For H160 hashes
export const sb_bytes = z.array(z.number().int().min(0).max(255)); // Vec<u8>

// Common option schema for null/empty storage values
export const sb_null_option = z.null();

export * from "../../../types"