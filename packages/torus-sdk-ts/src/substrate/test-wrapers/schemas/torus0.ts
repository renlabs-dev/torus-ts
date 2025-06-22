import { z } from 'zod';
import {
  sb_amount,
  sb_blocks,
  sb_percent,
  sb_address,
  sb_some,
  sb_number_int,
  sb_bigint,
} from "../../../types";

// Base schemas for torus0 pallet
export { sb_amount, sb_address, sb_some };
export const sb_block_number = sb_blocks;
export const sb_percentage = sb_percent;

// Numeric schemas
export const sb_u16 = z.number().int().min(0).max(65535);
// For values that come as AbstractInt/BigNumber from Substrate
export const sb_u16_substrate = sb_number_int;
export const sb_u64 = sb_bigint;

// Agent schema for torus0.agents storage - based on actual blockchain data
export const AGENT_SCHEMA = z.object({
  key: z.string(), // Account address as string
  name: z.string(), // Hex-encoded bytes
  url: z.string(), // Hex-encoded bytes  
  metadata: z.string(), // Hex-encoded bytes
  weightPenaltyFactor: z.number(), // Raw number
  registrationBlock: z.number(), // Raw number
  fees: z.object({
    stakingFee: z.number(),
    weightControlFee: z.number(),
  }),
  lastUpdateBlock: z.number(),
});

// Burn configuration schema
export const BURN_CONFIG_SCHEMA = z.object({
  targetRegistrationsInterval: sb_u16,
  targetRegistrationsPerInterval: sb_u16,
  maxBurn: sb_amount,
  minBurn: sb_amount,
  adjustmentAlpha: sb_u64,
});

// Fee constraints schema - use z.any() for Substrate Map objects for now
export const FEE_CONSTRAINTS_SCHEMA = z.any(); // Complex Substrate Map

// Namespace pricing config schema - use z.any() for Substrate Map objects for now  
export const NAMESPACE_PRICING_CONFIG_SCHEMA = z.any(); // Complex Substrate Map with BigNumbers

// Burn config schema - use z.any() for Substrate Map objects for now
export const BURN_CONFIG_UPDATED_SCHEMA = z.any(); // Complex Substrate Map with BigNumbers

// Pallet version schema - BN number from Substrate
export const PALLET_VERSION_SCHEMA = sb_number_int;