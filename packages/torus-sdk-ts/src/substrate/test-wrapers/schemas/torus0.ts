import { AGENT_SCHEMA } from "../../../modules/subspace.js";
import {
  sb_address,
  sb_amount,
  sb_bigint,
  sb_blocks,
  sb_number_int,
  sb_percent,
  sb_some,
  sb_struct,
  sb_to_primitive,
} from "../../../types/index.js";

// Base schemas for torus0 pallet
export { sb_address, sb_amount, sb_some };
export const sb_block_number = sb_blocks;
export const sb_percentage = sb_percent;

// Numeric schemas - use substrate number parsing
// For values that come as AbstractInt/BigNumber from Substrate
export const sb_u16_substrate = sb_number_int;
export const sb_u64 = sb_bigint;

// Export the correct AGENT_SCHEMA from subspace module
export { AGENT_SCHEMA };

// Burn configuration schema
export const BURN_CONFIG_SCHEMA = sb_struct({
  targetRegistrationsInterval: sb_number_int,
  targetRegistrationsPerInterval: sb_number_int,
  maxBurn: sb_amount,
  minBurn: sb_amount,
  adjustmentAlpha: sb_bigint,
});

// Fee constraints schema - use sb_to_primitive for Substrate Map objects
export const FEE_CONSTRAINTS_SCHEMA = sb_to_primitive; // Complex Substrate Map

// Namespace pricing config schema - use sb_to_primitive for Substrate Map objects
export const NAMESPACE_PRICING_CONFIG_SCHEMA = sb_to_primitive; // Complex Substrate Map with BigNumbers

// Burn config schema - use sb_to_primitive for Substrate Map objects
export const BURN_CONFIG_UPDATED_SCHEMA = sb_to_primitive; // Complex Substrate Map with BigNumbers

// Pallet version schema - BN number from Substrate
export const PALLET_VERSION_SCHEMA = sb_number_int;