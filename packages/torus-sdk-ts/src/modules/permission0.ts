import type { ApiPromise } from "@polkadot/api";
import type { Option } from "@polkadot/types";
import type { Codec } from "@polkadot/types/types";
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";
import type { z } from "zod";

import type { SS58Address } from "../address";
import {
  sb_address,
  sb_array,
  sb_balance,
  sb_bigint,
  sb_blocks,
  sb_bool,
  sb_enum,
  sb_h256,
  sb_null,
  sb_option,
  sb_percent,
  sb_some,
  sb_struct,
} from "../types";

type Api = ApiPromise;

// ============================================================================
// Base Types
// ============================================================================

export const PERMISSION_ID_SCHEMA = sb_h256;
export const STREAM_ID_SCHEMA = sb_h256;

export type PermissionId = z.infer<typeof PERMISSION_ID_SCHEMA>;
export type StreamId = z.infer<typeof STREAM_ID_SCHEMA>;

// ============================================================================
// Curator Permissions (Bitflags)
// ============================================================================

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

// ============================================================================
// Emission Types
// ============================================================================

export const EMISSION_ALLOCATION_SCHEMA = sb_enum({
  Streams: sb_array(
    sb_struct({
      streamId: STREAM_ID_SCHEMA,
      percentage: sb_percent,
    }),
  ),
  FixedAmount: sb_balance,
});

export const DISTRIBUTION_CONTROL_SCHEMA = sb_enum({
  Manual: sb_null,
  Automatic: sb_balance, // threshold amount
  AtBlock: sb_blocks,
  Interval: sb_blocks,
});

export const EMISSION_SCOPE_SCHEMA = sb_struct({
  allocation: EMISSION_ALLOCATION_SCHEMA,
  distribution: DISTRIBUTION_CONTROL_SCHEMA,
  targets: sb_array(
    sb_struct({
      account: sb_address,
      weight: sb_bigint, // u16 as bigint
    }),
  ),
  accumulating: sb_bool,
});

export type EmissionAllocation = z.infer<typeof EMISSION_ALLOCATION_SCHEMA>;
export type DistributionControl = z.infer<typeof DISTRIBUTION_CONTROL_SCHEMA>;
export type EmissionScope = z.infer<typeof EMISSION_SCOPE_SCHEMA>;

// ============================================================================
// Curator Types
// ============================================================================

export const CURATOR_SCOPE_SCHEMA = sb_struct({
  flags: CURATOR_PERMISSIONS_SCHEMA,
  cooldown: sb_option(sb_blocks),
});

export type CuratorScope = z.infer<typeof CURATOR_SCOPE_SCHEMA>;

// ============================================================================
// Permission Scope
// ============================================================================

export const PERMISSION_SCOPE_SCHEMA = sb_enum({
  Emission: EMISSION_SCOPE_SCHEMA,
  Curator: CURATOR_SCOPE_SCHEMA,
});

export type PermissionScope = z.infer<typeof PERMISSION_SCOPE_SCHEMA>;

// ============================================================================
// Duration and Control Types
// ============================================================================

export const PERMISSION_DURATION_SCHEMA = sb_enum({
  UntilBlock: sb_blocks,
  Indefinite: sb_null,
});

export const REVOCATION_TERMS_SCHEMA = sb_enum({
  Irrevocable: sb_null,
  RevocableByGrantor: sb_null,
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

// ============================================================================
// Main Permission Contract
// ============================================================================

export const PERMISSION_CONTRACT_SCHEMA = sb_struct({
  grantor: sb_address,
  grantee: sb_address,
  scope: PERMISSION_SCOPE_SCHEMA,
  duration: PERMISSION_DURATION_SCHEMA,
  revocation: REVOCATION_TERMS_SCHEMA,
  enforcement: ENFORCEMENT_AUTHORITY_SCHEMA,
  lastExecution: sb_option(sb_blocks),
  executionCount: sb_bigint, // u32 as bigint
  parent: sb_option(PERMISSION_ID_SCHEMA),
  createdAt: sb_blocks,
});

export type PermissionContract = z.infer<typeof PERMISSION_CONTRACT_SCHEMA>;

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Query a specific permission by ID
 */
export async function queryPermission(
  api: Api,
  permissionId: PermissionId,
): Promise<PermissionContract | null> {
  const [queryError, query] = await tryAsync(
    api.query.permission0.permissions(permissionId),
  );

  if (queryError) {
    throw new Error(`Failed to query permission: ${queryError.message}`);
  }

  const option = query as Option<Codec>;
  if (option.isNone) {
    return null;
  }

  const [parseError, result] = trySync(() =>
    PERMISSION_CONTRACT_SCHEMA.parse(option.unwrap().toJSON()),
  );

  if (parseError) {
    throw new Error(`Failed to parse permission: ${parseError.message}`);
  }

  return result;
}

/**
 * Query all permissions
 */
export async function queryPermissions(
  api: Api,
): Promise<Map<PermissionId, PermissionContract>> {
  const [queryError, query] = await tryAsync(
    api.query.permission0.permissions.entries(),
  );

  if (queryError) {
    throw new Error(`Failed to query permissions: ${queryError.message}`);
  }

  const permissionsMap = new Map<PermissionId, PermissionContract>();

  for (const [key, value] of query) {
    if (value.isSome) {
      const id = PERMISSION_ID_SCHEMA.parse(key.toHex());
      const contract = sb_some(PERMISSION_CONTRACT_SCHEMA).parse(value);
      permissionsMap.set(id, contract);
    }
  }

  return permissionsMap;
}

/**
 * Query permissions by grantor
 */
export async function queryPermissionsByGrantor(
  api: Api,
  grantor: string,
): Promise<PermissionId[]> {
  const [queryError, query] = await tryAsync(
    api.query.permission0.permissionsByGrantor(grantor),
  );

  if (queryError) {
    throw new Error(
      `Failed to query permissions by grantor: ${queryError.message}`,
    );
  }

  const [parseError, result] = trySync(() =>
    sb_array(PERMISSION_ID_SCHEMA).parse(query.toJSON()),
  );

  if (parseError) {
    throw new Error(
      `Failed to parse permissions by grantor: ${parseError.message}`,
    );
  }

  return result;
}

/**
 * Query permissions by grantee
 */
export async function queryPermissionsByGrantee(
  api: Api,
  grantee: string,
): Promise<PermissionId[]> {
  const [queryError, query] = await tryAsync(
    api.query.permission0.permissionsByGrantee(grantee),
  );

  if (queryError) {
    throw new Error(
      `Failed to query permissions by grantee: ${queryError.message}`,
    );
  }

  const [parseError, result] = trySync(() =>
    sb_array(PERMISSION_ID_SCHEMA).parse(query.toJSON()),
  );

  if (parseError) {
    throw new Error(
      `Failed to parse permissions by grantee: ${parseError.message}`,
    );
  }

  return result;
}

/**
 * Query permissions between grantor and grantee
 */
export async function queryPermissionsByParticipants(
  api: Api,
  grantor: string,
  grantee: string,
): Promise<PermissionId[]> {
  const [queryError, query] = await tryAsync(
    api.query.permission0.permissionsByParticipants([grantor, grantee]),
  );

  if (queryError) {
    throw new Error(
      `Failed to query permissions by participants: ${queryError.message}`,
    );
  }

  const [parseError, result] = trySync(() =>
    sb_array(PERMISSION_ID_SCHEMA).parse(query.toJSON()),
  );

  if (parseError) {
    throw new Error(
      `Failed to parse permissions by participants: ${parseError.message}`,
    );
  }

  return result;
}

/**
 * Query accumulated stream amounts for an account and permission
 */
export async function queryAccumulatedStreamAmounts(
  api: Api,
  account: string,
  streamId: StreamId,
  permissionId: PermissionId,
): Promise<bigint | null> {
  const [queryError, query] = await tryAsync(
    api.query.permission0.accumulatedStreamAmounts([
      account,
      streamId,
      permissionId,
    ]),
  );

  if (queryError) {
    throw new Error(
      `Failed to query accumulated stream amounts: ${queryError.message}`,
    );
  }

  const [parseError, result] = trySync(() => sb_balance.parse(query));

  if (parseError) {
    throw new Error(
      `Failed to parse accumulated stream amounts: ${parseError.message}`,
    );
  }

  return result;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if curator has specific permission flag
 */
export function hasCuratorFlag(
  permissions: CuratorPermissions,
  flag: bigint,
): boolean {
  return (permissions.bits & flag) === flag;
}

// FIXME: fix isPermissionExpired
// /**
//  * Check if permission is expired
//  */
// export function isPermissionExpired(
//   permission: PermissionContract,
//   currentBlock: bigint,
// ): boolean {
//   if (permission.duration.Indefinite !== undefined) {
//     return false;
//   }
//   if (permission.duration.UntilBlock !== undefined) {
//     return currentBlock >= permission.duration.UntilBlock;
//   }
//   return false;
// }

// FIXME: fix canExecutePermission
// /**
//  * Check if permission can be executed
//  */
// export function canExecutePermission(
//   permission: PermissionContract,
//   currentBlock: bigint,
// ): boolean {
//   return !isPermissionExpired(permission, currentBlock);
// }

// FIXME: fix getPermissionType
// /**
//  * Get permission type string
//  */
// export function getPermissionType(permission: PermissionContract): string {
//   if (permission.scope.Emission !== undefined) {
//     return "Emission";
//   }
//   if (permission.scope.Curator !== undefined) {
//     return "Curator";
//   }
//   return "Unknown";
// }

// ============================================================================
// Transaction Functions
// ============================================================================

/**
 * Grant an emission permission to a grantee
 */
export function grantEmissionPermission(
  api: Api,
  grantee: string,
  allocation: EmissionAllocation,
  targets: [SS58Address, number][],
  distribution: DistributionControl,
  duration: PermissionDuration,
  revocation: RevocationTerms,
  enforcement: EnforcementAuthority,
) {
  // grantee: T::AccountId,
  // allocation: EmissionAllocation<T>,
  // targets: Vec<(T::AccountId, u16)>,
  // distribution: DistributionControl<T>,
  // duration: PermissionDuration<T>,
  // revocation: RevocationTerms<T>,
  // enforcement: EnforcementAuthority<T>,
  return api.tx.permission0.grantEmissionPermission(
    grantee,
    allocation,
    targets,
    distribution,
    duration,
    revocation,
    enforcement,
  );
}
