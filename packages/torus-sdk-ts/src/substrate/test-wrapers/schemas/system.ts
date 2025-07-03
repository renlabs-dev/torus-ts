/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { z } from "zod";

import {
  sb_address,
  sb_amount,
  sb_blocks,
  sb_number_int,
} from "../../../types/index.js";

// Re-export shared schemas
export { sb_address, sb_amount, sb_blocks, sb_number_int };

// System-specific schemas
export const sb_string = z.string();

// Boolean schema - Substrate Bool codec that converts to JSON boolean
export const sb_boolean = z.any().transform((val) => {
  if (typeof val === 'boolean') return val;
  if (val && typeof val.toPrimitive === 'function') return val.toPrimitive();
  if (val && typeof val.toJSON === 'function') return val.toJSON();
  return Boolean(val);
});

// Hash schema - Substrate Hash codec that converts to JSON string
export const sb_hash = z.any().transform((val) => {
  if (typeof val === 'string') return val;
  if (val && typeof val.toString === 'function') return val.toString();
  return String(val);
});

// AccountInfo schema - based on actual blockchain data
export const ACCOUNT_INFO_SCHEMA = z.object({
  nonce: z.number(),
  consumers: z.number(),
  providers: z.number(),
  sufficients: z.number(),
  data: z.object({
    free: z.string(), // Hex amount like "0x000000000000000658ac2fd3ba55f000"
    reserved: z.number(),
    frozen: z.number(),
    flags: z.string(), // Hex flags like "0x80000000000000000000000000000000"
  }),
});

// Block weight schema - complex Substrate Map
export const BLOCK_WEIGHT_SCHEMA = z.any(); // Complex Substrate Map with weight info

// Digest schema - complex structure with logs (Substrate Map)
export const DIGEST_SCHEMA = z.any(); // Complex Substrate Map with logs

// Event schema - complex Substrate structure
export const EVENT_SCHEMA = z.any(); // Complex Substrate event array

// Last runtime upgrade schema - use z.any() for Substrate Map  
export const LAST_RUNTIME_UPGRADE_SCHEMA = z.any(); // Complex Substrate Map

// Optional value schemas for storage that can be null (Substrate Option codec)
export const sb_optional_number = z.any().transform((val) => {
  if (val === null || val === undefined) return null;
  if (val && typeof val.toPrimitive === 'function') return val.toPrimitive();
  if (val && typeof val.toJSON === 'function') return val.toJSON();
  if (typeof val === 'number') return val;
  return null;
});

export const sb_optional_any = z.any().transform((val) => {
  if (val === null || val === undefined) return null;
  if (val && typeof val.toPrimitive === 'function') return val.toPrimitive();
  if (val && typeof val.toJSON === 'function') return val.toJSON();
  return val;
});