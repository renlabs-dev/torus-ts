import { ApiPromise, WsProvider } from "@polkadot/api";
import { z } from "zod";

import { strToByteArray } from "@torus-network/torus-utils";
import type { Result } from "@torus-network/torus-utils/result";
import { makeErr, makeOk } from "@torus-network/torus-utils/result";
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";

import type { SS58Address } from "../types/address.js";
import {
  namespacePathParser,
  validateNamespacePath,
} from "../types/namespace/index.js";
import {
  sb_address,
  sb_bigint,
  sb_enum,
  sb_null,
  sb_some,
  sb_string,
  sb_struct,
} from "../types/zod.js";
import type { Api } from "./common/index.js";
import { handleDoubleMapEntries } from "./common/index.js";

// ==== Namespaces ====

export const sb_namespace_path = sb_string.transform((path, ctx) => {
  const [err, segments] = validateNamespacePath(path);
  if (err !== undefined) {
    ctx.addIssue({
      code: "custom",
      path: ctx.path,
      message: err,
    });
    return z.NEVER;
  }
  return segments;
});

const NAMESPACE_OWNERSHIP_SCHEMA = sb_enum({
  System: sb_null,
  Account: sb_address,
});

const NAMESPACE_METADATA_SCHEMA = sb_struct({
  createdAt: sb_bigint,
  deposit: sb_bigint,
});

export interface NamespaceEntry {
  path: string[];
  createdAt: bigint;
  deposit: bigint;
}

export async function queryNamespaceEntriesOf(
  api: Api,
  agent: SS58Address,
): Promise<NamespaceEntry[]> {
  const ownership = { Account: agent };

  const [queryErr, queryRes] = await tryAsync(
    api.query.torus0.namespaces.entries(ownership),
  );
  if (queryErr !== undefined) {
    throw queryErr;
  }

  const [handleError, result] = trySync(() =>
    handleDoubleMapEntries(
      queryRes,
      NAMESPACE_OWNERSHIP_SCHEMA,
      sb_namespace_path,
      sb_some(NAMESPACE_METADATA_SCHEMA),
    ),
  );

  if (handleError !== undefined) {
    throw handleError;
  }

  const [entriesMap] = result;
  const namespaceEntries: NamespaceEntry[] = [];

  for (const [_ownershipKey, pathsMap] of entriesMap) {
    // match(ownershipKey)({
    //   Account(_accountAddress) {},
    //   System() {},
    // });
    for (const [pathSegments, metadata] of pathsMap) {
      namespaceEntries.push({
        path: pathSegments,
        createdAt: metadata.createdAt,
        deposit: metadata.deposit,
      });
    }
  }

  return namespaceEntries;
}

// ---- Namespace Path Creation Cost ----

const NS_CREATION_COST_RPC_URL = "wss://api-30.nodes.torus.network";

/**
 * GAMBIARRA: connect to hardcoded node with image that exposes RPC method
 * to compute namespace path creation cost.
 *
 * This should be dropped once the main API nodes are updated.
 */
async function connectToNsCreationCostNode() {
  const provider = new WsProvider(NS_CREATION_COST_RPC_URL);
  const [error, api] = await tryAsync(ApiPromise.create({ provider }));
  if (error !== undefined) {
    console.error("Error creating API:", error);
    throw error;
  }
  return api;
}

/**
 * Queries the cost of creating a namespace path.
 *
 * This function calls the `torus0_namespacePathCreationCost` RPC method to
 * determine the fee and deposit required to create a namespace path for a given
 * account.
 *
 * **Note**: This RPC method is not automatically extracted by polkadot.js type
 * generation for unknown reasons, so it's implemented manually here.
 *
 * @param api - The Substrate API instance
 * @param accountId - The account that wants to create the namespace path
 * @param namespacePath - The namespace path to create (e.g. "agent.my-app.config")
 * @returns Result with fee and deposit amounts, or error if the operation fails
 *
 * @example
 * ```ts
 * const [error, costs] = await queryNamespacePathCreationCost(
 *   api,
 *   "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
 *   "agent.my-app.config"
 * );
 * if (error !== undefined) {
 *   console.error("Failed to get costs:", error);
 * } else {
 *   console.log(`Fee: ${costs.fee}, Deposit: ${costs.deposit}`);
 * }
 * ```
 */
export async function queryNamespacePathCreationCost(
  api: Api,
  accountId: SS58Address,
  namespacePath: string,
): Promise<Result<{ fee: bigint; deposit: bigint }, Error>> {
  // Validate the namespace path first
  const { data: path, error: pathError } =
    namespacePathParser().safeParse(namespacePath);
  if (pathError !== undefined) {
    return makeErr(new Error(`Invalid namespace path: ${pathError.message}`));
  }

  // // GAMBIARRA: connect to hardcoded node with image that exposes RPC method
  // const api = await connectToNsCreationCostNode();

  // Call the RPC method manually since it's not auto-generated
  // Note: Using provider send method because this RPC method is not auto-decorated

  // Convert the validated path string to bytes as expected by the substrate RPC
  const pathBytes = strToByteArray(path);

  const [rpcError, rpcResult] = await tryAsync(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call
    (api as any)._rpcCore.provider.send("torus0_namespacePathCreationCost", [
      accountId,
      pathBytes,
    ]),
  );
  if (rpcError !== undefined) {
    return makeErr(new Error(`RPC call failed: ${rpcError.message}`));
  }

  // Parse the result as a tuple of (Balance, Balance)
  const [parseError, parsedResult] = trySync(() => {
    if (!Array.isArray(rpcResult) || rpcResult.length !== 2) {
      throw new Error(
        `Expected RPC result to be a tuple of two Balance values, got: ${JSON.stringify(rpcResult)}`,
      );
    }

    // TODO: sb_ Zod parser for tuple

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const [feeRaw, depositRaw] = rpcResult;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const fee = BigInt(feeRaw);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const deposit = BigInt(depositRaw);

    return { fee, deposit };
  });

  if (parseError !== undefined) {
    return makeErr(
      new Error(`Failed to parse RPC result: ${parseError.message}`),
    );
  }

  return makeOk(parsedResult);
}