import type { ApiPromise } from "@polkadot/api";

import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";
import { z } from "zod";
import { validateNamespacePath } from "@torus-network/torus-utils/validation";
import { match } from "rustie";

import type { SS58Address } from "../address.js";
import {
  sb_address,
  sb_bigint,
  sb_enum,
  sb_null,
  sb_some,
  sb_string,
  sb_struct,
} from "../types/zod.js";
import { handleDoubleMapEntries } from "./_common.js";

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

export async function queryNamespaceEntriesOf(
  api: ApiPromise,
  agent: SS58Address,
) {
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
  const namespaceEntries: [string[], { createdAt: bigint; deposit: bigint }][] =
    [];

  // Kelvin will eat my purple for everything bellow this line
  for (const [ownershipKey, pathsMap] of entriesMap) {
    match(ownershipKey)({
      Account(accountAddress) {
        if (accountAddress !== agent) {
          throw new Error(
            `Unexpected ownership key: expected ${agent}, got ${accountAddress}`,
          );
        }

        for (const [pathSegments, metadata] of pathsMap) {
          namespaceEntries.push([pathSegments, metadata]);
        }
      },
      System() {
        throw new Error(
          `Unexpected ownership type: expected Account, got System`,
        );
      },
    });
  }

  return namespaceEntries;
}
