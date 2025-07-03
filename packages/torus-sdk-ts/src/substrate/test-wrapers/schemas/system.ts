import { z } from "zod";
import {
  sb_address,
  sb_bigint,
  sb_blocks,
  sb_number_int,
  sb_bool,
  sb_h256,
  sb_string,
  sb_struct,
  sb_array,
  sb_option,
  sb_substrate_type,
  sb_basic_enum,
} from "../../../types/index.js";
import { PALLET_BALANCES_ACCOUNT_DATA_SCHEMA } from "./balances.js";

// Re-export shared schemas
export { sb_address, sb_blocks, sb_number_int, sb_string, sb_bool, sb_h256 };

// SpWeightsWeightV2Weight schema - based on types-lookup.ts line 38-42
export const SP_WEIGHTS_WEIGHT_V2_SCHEMA = sb_struct({
  refTime: sb_bigint,    // Compact<u64>
  proofSize: sb_bigint,  // Compact<u64>
});

export type SpWeightsWeightV2Weight = z.infer<typeof SP_WEIGHTS_WEIGHT_V2_SCHEMA>;


// FrameSupportDispatchDispatchClass enum - based on types-lookup.ts line 123-129
export const FRAME_SUPPORT_DISPATCH_DISPATCH_CLASS_SCHEMA = sb_basic_enum(['Normal', 'Operational', 'Mandatory'] as const);

export type FrameSupportDispatchDispatchClass = z.infer<typeof FRAME_SUPPORT_DISPATCH_DISPATCH_CLASS_SCHEMA>;

// FrameSupportDispatchPays enum - based on types-lookup.ts line 131-136
export const FRAME_SUPPORT_DISPATCH_PAYS_SCHEMA = sb_basic_enum(['Yes', 'No'] as const);

export type FrameSupportDispatchPays = z.infer<typeof FRAME_SUPPORT_DISPATCH_PAYS_SCHEMA>;

// FrameSupportDispatchDispatchInfo schema - based on types-lookup.ts line 116-121
export const FRAME_SUPPORT_DISPATCH_DISPATCH_INFO_SCHEMA = sb_struct({
  weight: SP_WEIGHTS_WEIGHT_V2_SCHEMA,                       // SpWeightsWeightV2Weight
  class: FRAME_SUPPORT_DISPATCH_DISPATCH_CLASS_SCHEMA,       // FrameSupportDispatchDispatchClass
  paysFee: FRAME_SUPPORT_DISPATCH_PAYS_SCHEMA,               // FrameSupportDispatchPays
});

export type FrameSupportDispatchDispatchInfo = z.infer<typeof FRAME_SUPPORT_DISPATCH_DISPATCH_INFO_SCHEMA>;

// Use the shared substrate type schema for all complex types
export const SP_RUNTIME_DIGEST_SCHEMA = sb_substrate_type;
export const FRAME_SUPPORT_DISPATCH_PER_DISPATCH_CLASS_WEIGHT_SCHEMA = sb_substrate_type;
export const FRAME_SYSTEM_ACCOUNT_INFO_SCHEMA = sb_substrate_type;
export const LAST_RUNTIME_UPGRADE_SCHEMA = sb_substrate_type;

// For events, use an array of substrate types
export const EVENTS_SCHEMA = sb_array(sb_substrate_type);

// Export type aliases
export type SpRuntimeDigest = string; // hex string
export type FrameSupportDispatchPerDispatchClassWeight = string; // hex string
export type FrameSystemAccountInfo = string; // hex string
export type LastRuntimeUpgrade = string; // hex string
export type Events = string[]; // array of hex strings


// Optional value schemas for storage that can be null (Substrate Option codec)
export const sb_optional_number = sb_option(sb_number_int);
export const sb_optional_string = sb_option(sb_string);
export const sb_optional_any = sb_option(sb_string); // Generic optional for compatibility