import type { ApiPromise } from "@polkadot/api";
import type { AccountId32, H256 } from "@polkadot/types/interfaces";
import { blake2AsHex, decodeAddress } from "@polkadot/util-crypto";
import { getOrSetDefault } from "@torus-network/torus-utils/collections";
import type { Result } from "@torus-network/torus-utils/result";
import { makeErr, makeOk } from "@torus-network/torus-utils/result";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import type { Nullable } from "@torus-network/torus-utils/typing";
import { if_let, match } from "rustie";
import { z } from "zod";

import type { SS58Address } from "../address.js";
import type { ToBigInt, ZError } from "../types/index.js";
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
} from "../types/index.js";
import { sb_namespace_path } from "./torus0.js";
import type { Api } from "./_common.js";
import { SbQueryError } from "./_common.js";
import { BasicLogger } from "@torus-network/torus-utils/logger";
import { BTreeMap, BTreeSet } from "@polkadot/types";
import type { Bytes, u16 } from "@polkadot/types";
import type { Percent } from "@polkadot/types/interfaces";

const logger = BasicLogger.create({ name: "torus-sdk-ts.modules.permission0" });

// ==== Data types ====

export const PERMISSION_ID_SCHEMA = sb_h256;
export const STREAM_ID_SCHEMA = sb_h256;

// TODO: branded types on PermissionId and StreamId
export type PermissionId = z.infer<typeof PERMISSION_ID_SCHEMA>;
export type StreamId = z.infer<typeof STREAM_ID_SCHEMA>;

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

// ---- Emission Types ----

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
  paths: sb_array(sb_namespace_path),
});

export type NamespaceScope = z.infer<typeof NAMESPACE_SCOPE_SCHEMA>;

// ---- Permission Scope ----

export const PERMISSION_SCOPE_SCHEMA = sb_enum({
  Emission: EMISSION_SCOPE_SCHEMA,
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

// ---- Main Permission Contract ----

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
 * Query a specific permission by ID.
 *
 * @return `Ok<null>` if the permission does not exist.
 */
export async function queryPermission(
  api: Api,
  permissionId: string,
): Promise<
  Result<Nullable<PermissionContract>, SbQueryError | ZError<unknown>>
> {
  const [queryError, query] = await tryAsync(
    api.query.permission0.permissions(permissionId),
  );
  if (queryError) return makeErr(SbQueryError.from(queryError));

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
    SbQueryError | ZError<H256> | ZError<PermissionContract>
  >
> {
  const [queryError, query] = await tryAsync(
    api.query.permission0.permissions.entries(),
  );
  if (queryError) return makeErr(SbQueryError.from(queryError));

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
 * Query permissions by grantor.
 *
 * @return `Ok<null>` if no permissions found of the given grantor.
 */
export async function queryPermissionsByGrantor(
  api: Api,
  grantor: SS58Address,
): Promise<Result<`0x${string}`[], SbQueryError | ZError<unknown>>> {
  const [queryError, query] = await tryAsync(
    api.query.permission0.permissionsByGrantor(grantor),
  );
  if (queryError) return makeErr(SbQueryError.from(queryError));

  const parsed = sb_array(PERMISSION_ID_SCHEMA).safeParse(query);
  if (parsed.success === false) return makeErr(parsed.error);

  return makeOk(parsed.data);
}

/**
 * Query permissions by grantee.
 *
 * @return `Ok<null>` if no permissions found of the given grantee.
 */
export async function queryPermissionsByGrantee(
  api: Api,
  grantee: SS58Address,
): Promise<Result<PermissionId[], SbQueryError | ZError<unknown>>> {
  const [queryError, query] = await tryAsync(
    api.query.permission0.permissionsByGrantee(grantee),
  );
  if (queryError) return makeErr(SbQueryError.from(queryError));

  const parsed = sb_array(PERMISSION_ID_SCHEMA).safeParse(query);
  if (parsed.success === false) return makeErr(parsed.error);

  return makeOk(parsed.data);
}

/**
 * Query permissions between grantor and grantee.
 *
 * @return `Ok<null>` if no permissions found for the given participants.
 */
export async function queryPermissionsByParticipants(
  api: Api,
  grantor: SS58Address,
  grantee: SS58Address,
): Promise<Result<PermissionId[], SbQueryError | ZError<unknown>>> {
  const [queryError, query] = await tryAsync(
    api.query.permission0.permissionsByParticipants([grantor, grantee]),
  );
  if (queryError) return makeErr(SbQueryError.from(queryError));

  const parsed = sb_array(PERMISSION_ID_SCHEMA).safeParse(query);
  if (parsed.success === false) return makeErr(parsed.error);

  return makeOk(parsed.data);
}

/**
 * Query all namespace permissions from the blockchain.
 * Filters all permissions to return only those with Namespace scope.
 *
 * @return A map of PermissionId -> PermissionContract for all namespace permissions
 */
export async function queryNamespacePermissions(
  api: Api,
): Promise<
  Result<
    Map<PermissionId, PermissionContract>,
    SbQueryError | ZError<H256> | ZError<PermissionContract>
  >
> {
  const [permissionsError, allPermissions] = await queryPermissions(api);
  if (permissionsError) return makeErr(permissionsError);

  const namespacePermissions = new Map<PermissionId, PermissionContract>();

  for (const [permissionId, permission] of allPermissions) {
    match(permission.scope)({
      Namespace: () => {
        namespacePermissions.set(permissionId, permission);
      },
      Emission: () => {
        // Skip emission permissions
      },
      Curator: () => {
        // Skip curator permissions
      },
    });
  }

  return makeOk(namespacePermissions);
}

/**
 * Query accumulated stream amounts for an account
 *
 * @returns A map (StreamId -> PermissionId -> Amount)
 */
export async function queryAccumulatedStreamsForAccount(
  api: Api,
  account: SS58Address,
): Promise<
  Result<
    Map<StreamId, Map<PermissionId, bigint>>,
    SbQueryError | ZError<H256> | ZError<ToBigInt>
  >
> {
  const [queryError, streamTuples] = await tryAsync(
    api.query.permission0.accumulatedStreamAmounts.entries(account),
  );
  if (queryError) return makeErr(SbQueryError.from(queryError));

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

/**
 * Extract streams from a permission.
 */
export const extractStreamsFromPermission = (permission: PermissionContract) =>
  if_let(permission.scope, "Emission")(
    (emissionScope) =>
      if_let(emissionScope.allocation, "Streams")(
        (streams) => streams,
        () => null,
      ),
    () => null,
  );

/**
 * Check if a permission is enabled by verifying that accumulating = true in an EmissionScope
 */
export async function isPermissionEnabled(
  api: Api,
  permissionId: PermissionId,
): Promise<Result<boolean, ZError<PermissionContract> | Error>> {
  const [permissionError, permission] = await queryPermission(
    api,
    permissionId,
  );
  if (permissionError !== undefined) return makeErr(permissionError);

  if (permission === null) {
    return makeErr(new Error(`Permission ${permissionId} not found`));
  }

  const isEnabled = match(permission.scope)({
    Emission(emissionScope) {
      return emissionScope.accumulating;
    },
    Curator() {
      // Curator permissions don't have an accumulating field
      // Consider them always "enabled" if they exist and aren't expired
      return true;
    },
    Namespace() {
      // Namespace permissions don't have an accumulating field
      // Consider them always "enabled" if they exist and aren't expired
      return true;
    },
  });

  return makeOk(isEnabled);
}

/**
 * Extract the available streams for an agent.
 *
 * Includes streams reaching the agent and it's root stream. Contains the
 * accumulated stream amounts when available, if `accumulatedStreams` is
 * provided.
 *
 * @param agentId - Agent to get available streams for
 * @param permissions - All permissions
 * @param accumulatedStreams - Accumulated streams amounts map
 */
export function buildAvailableStreamsFor(
  agentId: SS58Address,
  {
    permissions,
    accumulatedStreams,
  }: {
    permissions?: Map<PermissionId, PermissionContract>;
    accumulatedStreams?: Map<StreamId, Map<PermissionId, bigint>>;
  },
) {
  if (permissions == null && accumulatedStreams == null) {
    throw new Error("Must provide either permissions or accumulatedStreams");
  }

  const agentRootStreamId = generateRootStreamId(agentId);

  const streamsTotalMap = new Map<StreamId, bigint>();

  if (accumulatedStreams != null) {
    for (const [streamId, permToAmountMap] of accumulatedStreams) {
      for (const [_permId, amount] of permToAmountMap) {
        const cur = streamsTotalMap.get(streamId) ?? 0n;
        streamsTotalMap.set(streamId, cur + amount);
      }
    }
  }

  if (permissions != null) {
    for (const [_permId, permission] of permissions) {
      const grantee = permission.grantee;

      // Only add consider permissions that are granted to the agent
      if (grantee !== agentId) continue;

      const streams = extractStreamsFromPermission(permission);
      if (streams != null) {
        for (const [streamId, _alloc] of streams) {
          const cur = streamsTotalMap.get(streamId) ?? 0n;
          streamsTotalMap.set(streamId, cur);
        }
      }
    }
  }

  return {
    agentRootStreamId,
    streamsMap: streamsTotalMap,
  };
}

export interface DelegationStreamInfo {
  grantor: SS58Address;
  grantee: SS58Address;
  streamId: StreamId;
  percentage: number;
  targets: Map<SS58Address, bigint>;
  accumulatedAmount: bigint | null;
}

/**
 * Query delegation streams for a given account (i.e., streams that this account
 * is delegating to others).
 *
 * This function returns information about:
 * - Which streams the account is delegating
 * - To whom they are delegating (grantees)
 * - What percentage of each stream is being delegated
 * - The targets for each delegated permission
 * - How much has accumulated for each delegation
 *
 * @param api - The API instance
 * @param grantorAccount - The account ID to query delegation streams for
 * @returns A map of PermissionId -> DelegationStream showing all active
 *          delegations
 */
export async function queryDelegationStreamsByAccount(
  api: Api,
  grantorAccount: SS58Address,
  { getAccumulatedAmounts = false }: { getAccumulatedAmounts?: boolean } = {},
): Promise<Result<Map<PermissionId, DelegationStreamInfo>, SbQueryError>> {
  // TODO: reimplement this babushka correctly

  // Query all permissions where this account is the grantor (i.e. delegating)
  const [queryErr, permIds] = await queryPermissionsByGrantor(
    api,
    grantorAccount,
  );
  if (queryErr !== undefined) return makeErr(SbQueryError.from(queryErr));

  const delegationStreams = new Map<PermissionId, DelegationStreamInfo>();

  // For each permission, check if it's an emission permission with stream allocation
  for (const permissionId of permIds) {
    const [qErr, permission] = await queryPermission(api, permissionId);
    if (qErr !== undefined || permission === null) {
      logger.error(`Failed querying permission ${permissionId}:`, qErr);
      continue;
    }

    const delegationInfo: DelegationStreamInfo | null = if_let(
      permission.scope,
      "Emission",
    )(
      (emissionScope) =>
        if_let(emissionScope.allocation, "Streams")(
          (streamsMap) => {
            // This is a stream-based emission permission
            // The streams map contains StreamId -> percentage mappings
            const streamEntries = Array.from(streamsMap.entries());

            if (streamEntries.length > 0) {
              // FIXME: use all streams @jairo

              // For now, we'll use the first stream (most common case)
              // In practice, you might want to handle multiple streams differently
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              const [streamId, percentage] = streamEntries[0]!;

              return {
                grantor: grantorAccount,
                grantee: permission.grantee,
                streamId,
                percentage,
                targets: emissionScope.targets,
                accumulatedAmount: null,
              } as DelegationStreamInfo;
            }
            return null;
          },
          () => null,
        ),
      () => null,
    );

    // Skip non-stream permissions
    if (delegationInfo === null) continue;

    if (getAccumulatedAmounts) {
      // Try to get the accumulated amount for this stream delegation
      // TODO: refactor
      await (async () => {
        const [err, accumulatedStreams] =
          await queryAccumulatedStreamsForAccount(api, permission.grantee);
        if (err !== undefined) {
          logger.error(
            `Failed to query accumulated streams for account ${permission.grantee}:`,
            err,
          );
          return;
        }

        const streamsMap = accumulatedStreams.get(delegationInfo.streamId);
        if (streamsMap === undefined) return;

        const accumulatedAmount = streamsMap.get(permissionId);
        if (accumulatedAmount === undefined) return;

        delegationInfo.accumulatedAmount = accumulatedAmount;
      })();
    }

    delegationStreams.set(permissionId, delegationInfo);
  }

  return makeOk(delegationStreams);
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

/**
 * TODO: test
 * TODO: docs
 */
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
  const targetsMap = new Map(targets);

  const targetsMap_ = new BTreeMap<AccountId32, u16>(
    api.registry,
    "AccountId32",
    "u32",
    targetsMap,
  );

  return api.tx.permission0.grantEmissionPermission(
    grantee,
    allocation,
    targetsMap_,
    distribution,
    duration,
    revocation,
    enforcement,
  );
}

export function togglePermission(
  api: ApiPromise,
  permissionId: PermissionId,
  enable: boolean,
) {
  return api.tx.permission0.togglePermissionAccumulation(permissionId, enable);
}

export interface UpdateEmissionPermission {
  api: ApiPromise;
  permissionId: PermissionId;
  newTargets?: [SS58Address, number][];
  newStreams?: Map<StreamId, number>;
  newDistributionControl?: DistributionControl;
}

/**
  If you call as a grantee:
  you can only provide the new_targets,
  whenever you want, no limits. if the grantee sends
  new_streams/new_distribution_control, the extrinsic fails.

  If you call as a grantor:
  you can send all the values, 
  but only if the revocation term: is RevocableByGrantor
  is RevocableAfter(N) and CurrentBlock > N
  think of it as the revocation term defining whether
  the grantor can modify the contract without
  breaching the "terms of service"
 */
export function updateEmissionPermission({
  api,
  permissionId,
  newTargets,
  newStreams,
  newDistributionControl,
}: UpdateEmissionPermission) {
  const targetsMap = newTargets
    ? new BTreeMap<AccountId32, u16>(
        api.registry,
        "AccountId32",
        "u16",
        new Map(newTargets),
      )
    : new BTreeMap<AccountId32, u16>(
        api.registry,
        "AccountId32",
        "u16",
        new Map(),
      );

  const streamsMap = newStreams
    ? new BTreeMap<H256, Percent>(api.registry, "H256", "Percent", newStreams)
    : null;

  return api.tx.permission0.updateEmissionPermission(
    permissionId,
    targetsMap,
    streamsMap,
    newDistributionControl ?? null,
  );
}

/**
 * Revoke a permission. The caller must met revocation constraints or be a root key.
 **/
export function revokePermission(api: ApiPromise, permissionId: PermissionId) {
  return api.tx.permission0.revokePermission(permissionId);
}

export interface GrantNamespacePermission {
  api: ApiPromise;
  grantee: SS58Address;
  paths: string[];
  duration: PermissionDuration;
  revocation: RevocationTerms;
}

/**
 * Grant a permission over namespaces
 */
export function grantNamespacePermission({
  api,
  grantee,
  paths,
  duration,
  revocation,
}: GrantNamespacePermission) {
  const pathsSet = new BTreeSet<Bytes>(api.registry, "Bytes", paths);

  return api.tx.permission0.grantNamespacePermission(
    grantee,
    pathsSet,
    duration,
    revocation,
  );
}
