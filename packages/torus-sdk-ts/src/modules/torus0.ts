import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";
import { z } from "zod";
import { validateNamespacePath } from "@torus-network/torus-utils/validation";

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
import type { Api } from "./_common.js";
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
