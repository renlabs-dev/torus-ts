// TODO: fix z.unknown() holes

import type { ApiPromise } from "@polkadot/api";
import type { H256 } from "@polkadot/types/interfaces";
import { blake2AsHex, decodeAddress } from "@polkadot/util-crypto";
import { getOrSetDefault } from "@torus-network/torus-utils/collections";
import type { Result } from "@torus-network/torus-utils/result";
import { makeErr, makeOk } from "@torus-network/torus-utils/result";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { match } from "rustie";
import { z } from "zod";

import type { SS58Address } from "../address";
import type { ToBigInt, ZError } from "../types";
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
  sb_some,
  sb_struct,
} from "../types";
import type { Api } from "./_common";

// ==== Base Types ====

export const PERMISSION_ID_SCHEMA = sb_h256;
export const STREAM_ID_SCHEMA = sb_h256;

export type PermissionId = z.infer<typeof PERMISSION_ID_SCHEMA>;
export type StreamId = z.infer<typeof STREAM_ID_SCHEMA>;

// ==== Curator Permissions (Bitflags) ====

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

// ==== Emission Types ====

export const EMISSION_ALLOCATION_SCHEMA = sb_enum({
  Streams: sb_map(STREAM_ID_SCHEMA, sb_percent),
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
  targets: sb_map(sb_address, sb_bigint),
  accumulating: sb_bool,
});

export type EmissionAllocation = z.infer<typeof EMISSION_ALLOCATION_SCHEMA>;
export type DistributionControl = z.infer<typeof DISTRIBUTION_CONTROL_SCHEMA>;
export type EmissionScope = z.infer<typeof EMISSION_SCOPE_SCHEMA>;

// ==== Curator Types ====

export const CURATOR_SCOPE_SCHEMA = sb_struct({
  flags:
    // CURATOR_PERMISSIONS_SCHEMA, // FIXME
    z.unknown(),
  cooldown: sb_option(sb_blocks),
});

export type CuratorScope = z.infer<typeof CURATOR_SCOPE_SCHEMA>;

// ==== Permission Scope ====

export const PERMISSION_SCOPE_SCHEMA = sb_enum({
  Emission: EMISSION_SCOPE_SCHEMA,
  Curator: CURATOR_SCOPE_SCHEMA,
});

export type PermissionScope = z.infer<typeof PERMISSION_SCOPE_SCHEMA>;

// ==== Duration and Control Types ====

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

// ==== Main Permission Contract ====

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

// ==== Query Functions ====

/**
 * Query a specific permission by ID
 */
export async function queryPermission(
  api: Api,
  permissionId: PermissionId,
): Promise<
  Result<PermissionContract | null, ZError<PermissionContract> | Error>
> {
  const [queryError, query] = await tryAsync(
    api.query.permission0.permissions(permissionId),
  );
  if (queryError) return makeErr(queryError);

  const parsed = sb_some(PERMISSION_CONTRACT_SCHEMA).safeParse(query);
  if (parsed.success === false) return makeErr(parsed.error);

  return makeOk(parsed.data);
}

/**
 * Query all permissions
 */
export async function queryPermissions(
  api: Api,
): Promise<
  Result<
    Map<PermissionId, PermissionContract>,
    ZError<H256> | ZError<PermissionContract> | Error
  >
> {
  const [queryError, query] = await tryAsync(
    api.query.permission0.permissions.entries(),
  );
  if (queryError) return makeErr(queryError);

  const permissionsMap = new Map<PermissionId, PermissionContract>();

  for (const [keysRaw, valueRaw] of query) {
    const [keyRaw] = keysRaw.args;

    const idParsed = PERMISSION_ID_SCHEMA.safeParse(keyRaw, {
      path: ["storage", "permission0", "permissions", String(keyRaw)],
    });
    if (idParsed.success === false) return makeErr(idParsed.error);

    const contractParsed = sb_some(PERMISSION_CONTRACT_SCHEMA).safeParse(
      valueRaw,
      {
        path: [
          "storage",
          "permission0",
          "permissions",
          String(keyRaw),
          "<value>",
        ],
      },
    );
    if (contractParsed.success === false) return makeErr(contractParsed.error);

    permissionsMap.set(idParsed.data, contractParsed.data);
  }

  return makeOk(permissionsMap);
}

/**
 * Query permissions by grantor
 */
export async function queryPermissionsByGrantor(api: Api, grantor: string) {
  const [queryError, query] = await tryAsync(
    api.query.permission0.permissionsByGrantor(grantor),
  );
  if (queryError) return makeErr(queryError);

  const parsed = sb_some(sb_array(PERMISSION_ID_SCHEMA)).safeParse(query);
  if (parsed.success === false) return makeErr(parsed.error);

  return makeOk(parsed.data);
}

/**
 * Query permissions by grantee
 */
export async function queryPermissionsByGrantee(
  api: Api,
  grantee: string,
): Promise<Result<PermissionId[], ZError<H256[]> | Error>> {
  const [queryError, query] = await tryAsync(
    api.query.permission0.permissionsByGrantee(grantee),
  );
  if (queryError) return makeErr(queryError);

  const parsed = sb_some(sb_array(PERMISSION_ID_SCHEMA)).safeParse(query);
  if (parsed.success === false) return makeErr(parsed.error);

  return makeOk(parsed.data);
}

/**
 * Query permissions between grantor and grantee
 */
export async function queryPermissionsByParticipants(
  api: Api,
  grantor: string,
  grantee: string,
): Promise<Result<PermissionId[], ZError<H256[]> | Error>> {
  const [queryError, query] = await tryAsync(
    api.query.permission0.permissionsByParticipants([grantor, grantee]),
  );
  if (queryError) return makeErr(queryError);

  const parsed = sb_array(PERMISSION_ID_SCHEMA).safeParse(query.toJSON());
  if (parsed.success === false) return makeErr(parsed.error);

  return makeOk(parsed.data);
}

/**
 * Query accumulated stream amounts for an account and permission
 */
export async function queryAccumulatedStreamsForAccount(
  api: Api,
  account: string,
): Promise<
  Result<
    Map<StreamId, Map<PermissionId, bigint>>,
    ZError<H256> | ZError<ToBigInt> | Error
  >
> {
  const [queryError, streamTuples] = await tryAsync(
    api.query.permission0.accumulatedStreamAmounts.entries(account),
  );
  if (queryError) return makeErr(queryError);

  const result = new Map<StreamId, Map<PermissionId, bigint>>();

  for (const [keysRaw, valueRaw] of streamTuples) {
    const [_ac, streamIdRaw, permissionIdRaw] = keysRaw.args;

    const streamIdParsed = sb_h256.safeParse(streamIdRaw, {
      path: [
        "storage",
        "permission0",
        "accumulatedStreamAmounts",
        String(account),
        String(streamIdRaw),
      ],
    });
    if (streamIdParsed.success === false) return makeErr(streamIdParsed.error);

    const permissionIdParsed = sb_h256.safeParse(permissionIdRaw, {
      path: [
        "storage",
        "permission0",
        "accumulatedStreamAmounts",
        String(account),
        String(streamIdRaw),
        String(permissionIdRaw),
      ],
    });
    if (permissionIdParsed.success === false)
      return makeErr(permissionIdParsed.error);

    const valueParsed = sb_some(sb_balance).safeParse(valueRaw, {
      path: [
        "storage",
        "permission0",
        "accumulatedStreamAmounts",
        String(account),
        String(streamIdRaw),
        String(permissionIdRaw),
        "<value>",
      ],
    });
    if (valueParsed.success === false) return makeErr(valueParsed.error);

    const streamId = streamIdParsed.data;
    const permissionId = permissionIdParsed.data;
    const value = valueParsed.data;

    const mapForStream = getOrSetDefault(
      result,
      streamId,
      () => new Map<PermissionId, bigint>(),
    );
    mapForStream.set(permissionId, value);
  }

  return makeOk(result);
}

// ==== Utility Functions ====

/**
 * Static identifier prefix for root emission stream
 */
export const ROOT_STREAM_PREFIX = "torus:emission:root";

/**
 * Generates the root stream ID for an agent
 * @param agentId - The agent's account ID (SS58 address)
 * @returns The generated stream ID as a hex string
 */
export function generateRootStreamId(agentId: SS58Address): StreamId {
  // Convert prefix string to bytes
  const prefixBytes = new TextEncoder().encode(ROOT_STREAM_PREFIX);

  // Decode SS58 address to get the raw account ID bytes
  const accountIdBytes = decodeAddress(agentId);

  // Concatenate prefix bytes with account ID bytes
  const data = new Uint8Array(prefixBytes.length + accountIdBytes.length);
  data.set(prefixBytes, 0);
  data.set(accountIdBytes, prefixBytes.length);

  // Generate blake2 256-bit hash and return as hex string
  return blake2AsHex(data, 256);
}

/**
 * Check if curator has specific permission flag
 */
export function hasCuratorFlag(
  permissions: CuratorPermissions,
  flag: bigint,
): boolean {
  return (permissions.bits & flag) === flag;
}

/**
 * Check if permission is expired
 */
export function isPermissionExpired(
  permission: PermissionContract,
  currentBlock: bigint,
): boolean {
  match(permission.duration)({
    Indefinite() {
      return false;
    },
    UntilBlock(block) {
      return currentBlock > block;
    },
  });
  return false;
}

/**
 * Check if permission can be executed
 */
export function canExecutePermission(
  permission: PermissionContract,
  currentBlock: bigint,
): boolean {
  return !isPermissionExpired(permission, currentBlock);
}

// ==== Transaction Functions ====

/**
 * Grant an emission permission to a grantee
 */
export interface GrantEmissionPermission {
  api: ApiPromise;
  grantee: string;
  allocation: EmissionAllocation;
  targets: [SS58Address, number][];
  distribution: DistributionControl;
  duration: PermissionDuration;
  revocation: RevocationTerms;
  enforcement: EnforcementAuthority;
}

export function grantEmissionPermission({
  api,
  grantee,
  allocation,
  targets,
  distribution,
  duration,
  revocation,
  enforcement,
}: GrantEmissionPermission) {
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
