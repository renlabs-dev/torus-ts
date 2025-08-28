import { z } from "zod";
import {
  sb_address,
  sb_array,
  sb_balance,
  sb_bigint,
  sb_blocks,
  sb_bool,
  sb_enum,
  sb_h256,
  sb_map,
  sb_null,
  sb_option,
  sb_percent,
  sb_struct,
} from "../../types/index.js";
import { sb_namespace_path } from "../torus0/torus0-types.js";

export const PERMISSION_ID_SCHEMA = sb_h256;
export const STREAM_ID_SCHEMA = sb_h256;

// TODO: branded types on PermissionId and StreamId
export type PermissionId = z.infer<typeof PERMISSION_ID_SCHEMA>;
export type StreamId = z.infer<typeof STREAM_ID_SCHEMA>;

// Schema for accumulated stream amounts storage key: (AccountId, StreamId, PermissionId)
export const ACCUMULATED_STREAM_KEY_SCHEMA = sb_struct({
  delegator: sb_address,
  streamId: STREAM_ID_SCHEMA,
  permissionId: PERMISSION_ID_SCHEMA,
});

export const ACCUMULATED_STREAM_ENTRY_SCHEMA = sb_struct({
  delegator: sb_address,
  streamId: STREAM_ID_SCHEMA,
  permissionId: PERMISSION_ID_SCHEMA,
  amount: sb_balance,
});

export type AccumulatedStreamEntry = z.infer<
  typeof ACCUMULATED_STREAM_ENTRY_SCHEMA
>;

// ---- Curator Permissions (Bitflags) ----

export const CURATOR_PERMISSIONS_SCHEMA = sb_struct({
  bits: sb_bigint,
});

export type CuratorPermissions = z.infer<typeof CURATOR_PERMISSIONS_SCHEMA>;

// Curator permission flag constants
export const CURATOR_FLAGS = {
  ROOT: 0b0000_0001n,
  APPLICATION_REVIEW: 0b0000_0010n,
  WHITELIST_MANAGE: 0b0000_0100n,
  PENALTY_CONTROL: 0b0000_1000n,
} as const;

// ---- Stream Types (formerly Emission) ----

export const STREAM_ALLOCATION_SCHEMA = sb_enum({
  Streams: sb_map(STREAM_ID_SCHEMA, sb_percent),
  FixedAmount: sb_balance,
});

export const DISTRIBUTION_CONTROL_SCHEMA = sb_enum({
  Manual: sb_null,
  Automatic: sb_balance, // threshold amount
  AtBlock: sb_blocks,
  Interval: sb_blocks,
});

export const STREAM_SCOPE_SCHEMA = sb_struct({
  allocation: STREAM_ALLOCATION_SCHEMA,
  distribution: DISTRIBUTION_CONTROL_SCHEMA,
  recipients: sb_map(sb_address, sb_bigint), // Multiple recipients with weights
  recipientManagers: sb_array(sb_address), // BoundedBTreeSet serialized as array (camelCase in JSON)
  weightSetters: sb_array(sb_address), // BoundedBTreeSet serialized as array (camelCase in JSON)
  accumulating: sb_bool,
});

// ---- Curator Types ----

export const CURATOR_SCOPE_SCHEMA = sb_struct({
  flags:
    // CURATOR_PERMISSIONS_SCHEMA, // FIXME: z.unknown() hole on schema
    z.unknown(),
  cooldown: sb_option(sb_blocks),
});

export type CuratorScope = z.infer<typeof CURATOR_SCOPE_SCHEMA>;

// ---- Namespace Types ----

export const NAMESPACE_SCOPE_SCHEMA = sb_struct({
  recipient: sb_address,
  paths: sb_map(sb_option(PERMISSION_ID_SCHEMA), sb_array(sb_namespace_path)),
});

export type NamespaceScope = z.infer<typeof NAMESPACE_SCOPE_SCHEMA>;

// ---- Permission Scope ----

export const PERMISSION_SCOPE_SCHEMA = sb_enum({
  Stream: STREAM_SCOPE_SCHEMA, // Updated from Emission to Stream
  Curator: CURATOR_SCOPE_SCHEMA,
  Namespace: NAMESPACE_SCOPE_SCHEMA,
});

export type PermissionScope = z.infer<typeof PERMISSION_SCOPE_SCHEMA>;

// ---- Duration and Control Types ----

export const PERMISSION_DURATION_SCHEMA = sb_enum({
  UntilBlock: sb_blocks,
  Indefinite: sb_null,
});

export const REVOCATION_TERMS_SCHEMA = sb_enum({
  Irrevocable: sb_null,
  RevocableByDelegator: sb_null,
  RevocableByArbiters: sb_struct({
    accounts: sb_array(sb_address),
    requiredVotes: sb_bigint, // u32 as bigint
  }),
  RevocableAfter: sb_blocks,
});

export const ENFORCEMENT_AUTHORITY_SCHEMA = sb_enum({
  None: sb_null,
  ControlledBy: sb_struct({
    controllers: sb_array(sb_address),
    requiredVotes: sb_bigint, // u32 as bigint
  }),
});

export const ENFORCEMENT_REFERENDUM_SCHEMA = sb_enum({
  EmissionAccumulation: sb_bool,
  Execution: sb_null,
});

export type PermissionDuration = z.infer<typeof PERMISSION_DURATION_SCHEMA>;
export type RevocationTerms = z.infer<typeof REVOCATION_TERMS_SCHEMA>;
export type EnforcementAuthority = z.infer<typeof ENFORCEMENT_AUTHORITY_SCHEMA>;
export type EnforcementReferendum = z.infer<
  typeof ENFORCEMENT_REFERENDUM_SCHEMA
>;

// ---- Main Permission Contract ----

const PERMISSION_CONTRACT_SHAPE = {
  delegator: sb_address,
  // Note: recipient field removed - now stored in scope-specific structures
  scope: PERMISSION_SCOPE_SCHEMA,
  duration: PERMISSION_DURATION_SCHEMA,
  revocation: REVOCATION_TERMS_SCHEMA,
  enforcement: ENFORCEMENT_AUTHORITY_SCHEMA,
  lastExecution: sb_option(sb_blocks),
  executionCount: sb_bigint, // u32 as bigint
  maxInstances: sb_bigint, // u32 as bigint
  children: sb_array(PERMISSION_ID_SCHEMA), // BoundedBTreeSet serialized as array
  createdAt: sb_blocks,
};

export const PERMISSION_CONTRACT_SCHEMA = sb_struct(PERMISSION_CONTRACT_SHAPE);

export const STREAM_CONTRACT_SCHEMA = sb_struct({
  ...PERMISSION_CONTRACT_SHAPE,
  scope: STREAM_SCOPE_SCHEMA,
});

export type PermissionContract = z.infer<typeof PERMISSION_CONTRACT_SCHEMA>;
export type StreamContract = z.infer<typeof STREAM_CONTRACT_SCHEMA>;
export type StreamAllocation = z.infer<typeof STREAM_ALLOCATION_SCHEMA>;
export type DistributionControl = z.infer<typeof DISTRIBUTION_CONTROL_SCHEMA>;
export type StreamScope = z.infer<typeof STREAM_SCOPE_SCHEMA>;
