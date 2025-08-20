import type { H256 } from "@polkadot/types/interfaces";
import { blake2AsHex, decodeAddress } from "@polkadot/util-crypto";
import { if_let, match } from "rustie";

import { getOrSetDefault } from "@torus-network/torus-utils/collections";
import { BasicLogger } from "@torus-network/torus-utils/logger";
import type { Result } from "@torus-network/torus-utils/result";
import { makeErr, makeOk } from "@torus-network/torus-utils/result";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import type { Nullable } from "@torus-network/torus-utils/typing";

import type { SS58Address } from "../../types/address.js";
import type { ToBigInt, ZError } from "../../types/index.js";
import {
  sb_address,
  sb_array,
  sb_balance,
  sb_h256,
  sb_option,
  sb_some,
} from "../../types/index.js";
import type { Api } from "../common/fees.js";
import { SbQueryError } from "../common/fees.js";
import type {
  AccumulatedStreamEntry,
  CuratorPermissions,
  EmissionContract,
  PermissionContract,
  PermissionId,
  StreamId,
} from "./permission0-types.js";
import {
  PERMISSION_CONTRACT_SCHEMA,
  PERMISSION_ID_SCHEMA,
  STREAM_ID_SCHEMA,
} from "./permission0-types.js";

const logger = BasicLogger.create({ name: "torus-sdk-ts.modules.permission0" });

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
 * Query permissions by delegator.
 *
 * @return `Ok<null>` if no permissions found of the given delegator.
 */
export async function queryPermissionsByDelegator(
  api: Api,
  delegator: SS58Address,
): Promise<Result<`0x${string}`[], SbQueryError | ZError<unknown>>> {
  const [queryError, query] = await tryAsync(
    api.query.permission0.permissionsByDelegator(delegator),
  );
  if (queryError) return makeErr(SbQueryError.from(queryError));

  const parsed = sb_array(PERMISSION_ID_SCHEMA).safeParse(query);
  if (parsed.success === false) return makeErr(parsed.error);

  return makeOk(parsed.data);
}

/**
 * Query permissions by recipient.
 *
 * @return `Ok<null>` if no permissions found of the given recipient.
 */
export async function queryPermissionsByRecipient(
  api: Api,
  recipient: SS58Address,
): Promise<Result<PermissionId[], SbQueryError | ZError<unknown>>> {
  const [queryError, query] = await tryAsync(
    api.query.permission0.permissionsByRecipient(recipient),
  );
  if (queryError) return makeErr(SbQueryError.from(queryError));

  const parsed = sb_array(PERMISSION_ID_SCHEMA).safeParse(query);
  if (parsed.success === false) return makeErr(parsed.error);

  return makeOk(parsed.data);
}

/**
 * Query permissions between delegator and recipient.
 *
 * @return `Ok<null>` if no permissions found for the given participants.
 */
export async function queryPermissionsByParticipants(
  api: Api,
  delegator: SS58Address,
  recipient: SS58Address,
): Promise<Result<PermissionId[], SbQueryError | ZError<unknown>>> {
  const [queryError, query] = await tryAsync(
    api.query.permission0.permissionsByParticipants([delegator, recipient]),
  );
  if (queryError) return makeErr(SbQueryError.from(queryError));

  const parsed = sb_array(PERMISSION_ID_SCHEMA).safeParse(query);
  if (parsed.success === false) return makeErr(parsed.error);

  return makeOk(parsed.data);
}

/**
 * Query all emission permissions from the blockchain.
 * Filters all permissions to return only those with Emission scope,
 * then applies the provided filter function.
 *
 * @param api - The blockchain API instance
 * @param filterFn - Additional filter to apply to emission permissions
 * @return A map of PermissionId -> EmissionContract for filtered emission permissions
 */
export async function queryEmissionPermissions(
  api: Api,
  filterFn: (permission: EmissionContract) => boolean,
): Promise<
  Result<
    Map<PermissionId, EmissionContract>,
    SbQueryError | ZError<H256> | ZError<PermissionContract>
  >
> {
  const [permissionsError, allPermissions] = await queryPermissions(api);
  if (permissionsError) return makeErr(permissionsError);

  const emissionPermissions = new Map<PermissionId, EmissionContract>();

  for (const [permissionId, permission] of allPermissions) {
    match(permission.scope)({
      Emission: (emissionScope) => {
        // Reconstruct as EmissionContract with the extracted emission scope
        const emissionPermission: EmissionContract = {
          ...permission,
          scope: emissionScope,
        };
        if (filterFn(emissionPermission)) {
          emissionPermissions.set(permissionId, emissionPermission);
        }
      },
      Curator: () => {
        // Skip curator permissions
      },
      Namespace: () => {
        // Skip namespace permissions
      },
    });
  }

  return makeOk(emissionPermissions);
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
 * Query namespace permissions where the specified address is the recipient.
 *
 * @param api - The blockchain API instance
 * @param agentAddress - The SS58 address of the agent (recipient)
 * @returns A map of PermissionId -> PermissionContract for permissions where the agent is the recipient
 */
export async function queryAgentNamespacePermissions(
  api: Api,
  agentAddress: SS58Address,
): Promise<
  Result<
    Map<PermissionId, PermissionContract>,
    SbQueryError | ZError<H256> | ZError<PermissionContract>
  >
> {
  const [permissionsError, allPermissions] =
    await queryNamespacePermissions(api);
  if (permissionsError) return makeErr(permissionsError);

  const agentPermissions = new Map<PermissionId, PermissionContract>();

  for (const [permissionId, permission] of allPermissions) {
    if (permission.recipient === agentAddress) {
      agentPermissions.set(permissionId, permission);
    }
  }

  return makeOk(agentPermissions);
}

/**
 * Query all accumulated stream amounts from substrate
 * @returns Array of accumulated stream entries with proper Zod parsing
 */
export async function queryAllAccumulatedStreamAmounts(
  api: Api,
): Promise<
  Result<
    AccumulatedStreamEntry[],
    SbQueryError | ZError<AccumulatedStreamEntry>
  >
> {
  const [queryError, query] = await tryAsync(
    api.query.permission0.accumulatedStreamAmounts.entries(),
  );
  if (queryError) return makeErr(SbQueryError.from(queryError));

  const accumulatedAmounts: AccumulatedStreamEntry[] = [];

  for (const [keysRaw, valueRaw] of query) {
    const keyArgs = keysRaw.args;

    const [delegatorRaw, streamIdRaw, permissionIdRaw] = keyArgs;

    const delegatorParsed = sb_address.safeParse(delegatorRaw, {
      path: ["storage", "permission0", "accumulatedStreamAmounts", "delegator"],
    });
    if (delegatorParsed.success === false)
      return makeErr(delegatorParsed.error);

    const streamIdParsed = STREAM_ID_SCHEMA.safeParse(streamIdRaw, {
      path: ["storage", "permission0", "accumulatedStreamAmounts", "streamId"],
    });
    if (streamIdParsed.success === false) return makeErr(streamIdParsed.error);

    const permissionIdParsed = PERMISSION_ID_SCHEMA.safeParse(permissionIdRaw, {
      path: [
        "storage",
        "permission0",
        "accumulatedStreamAmounts",
        "permissionId",
      ],
    });
    if (permissionIdParsed.success === false)
      return makeErr(permissionIdParsed.error);

    // Parse balance value - the storage returns Option<BalanceOf<T>>
    const amountParsed = sb_some(sb_balance).safeParse(valueRaw, {
      path: ["storage", "permission0", "accumulatedStreamAmounts", "amount"],
    });
    if (amountParsed.success === false) return makeErr(amountParsed.error);

    accumulatedAmounts.push({
      delegator: delegatorParsed.data,
      streamId: streamIdParsed.data,
      permissionId: permissionIdParsed.data,
      amount: amountParsed.data,
    });
  }

  return makeOk(accumulatedAmounts);
}

/**
 * Query accumulated stream amounts for a specific delegator, stream, and permission
 */
export async function queryAccumulatedStreamAmount(
  api: Api,
  delegator: SS58Address,
  streamId: StreamId,
  permissionId: PermissionId,
): Promise<Result<bigint, Error>> {
  const [queryError, queryResult] = await tryAsync(
    api.query.permission0.accumulatedStreamAmounts(
      delegator,
      streamId,
      permissionId,
    ),
  );

  if (queryError) {
    return makeErr(
      new Error(
        `Failed to query accumulated stream amount: ${queryError.message}`,
      ),
    );
  }

  // Parse the Option<u128> result directly from the Option instance
  const parsed = sb_option(sb_balance).safeParse(queryResult);
  if (!parsed.success) {
    return makeErr(
      new Error(`Failed to parse accumulated amount: ${parsed.error.message}`),
    );
  }

  // Use match to handle Option type properly
  const amount = match(parsed.data)({
    None: () => BigInt(0),
    Some: (value) => value,
  });

  return makeOk(amount);
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
      const grantee = permission.recipient;

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
  delegator: SS58Address;
  recipient: SS58Address;
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
 * - To whom they are delegating (recipients)
 * - What percentage of each stream is being delegated
 * - The targets for each delegated permission
 * - How much has accumulated for each delegation
 *
 * @param api - The API instance
 * @param delegatorAccount - The account ID to query delegation streams for
 * @returns A map of PermissionId -> DelegationStream showing all active
 *          delegations
 */
export async function queryDelegationStreamsByAccount(
  api: Api,
  delegatorAccount: SS58Address,
  { getAccumulatedAmounts = false }: { getAccumulatedAmounts?: boolean } = {},
): Promise<Result<Map<PermissionId, DelegationStreamInfo>, SbQueryError>> {
  // TODO: reimplement this babushka correctly

  // Query all permissions where this account is the delegator (i.e. delegating)
  const [queryErr, permIds] = await queryPermissionsByDelegator(
    api,
    delegatorAccount,
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
                delegator: delegatorAccount,
                recipient: permission.recipient,
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
          await queryAccumulatedStreamsForAccount(api, permission.recipient);
        if (err !== undefined) {
          logger.error(
            `Failed to query accumulated streams for account ${permission.recipient}:`,
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
