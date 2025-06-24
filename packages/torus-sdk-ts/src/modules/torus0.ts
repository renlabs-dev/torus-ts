import type { ApiPromise } from "@polkadot/api";
import { z } from "zod";

import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";
import { validateNamespacePath } from "@torus-network/torus-utils/validation";

import type { SS58Address } from "../address.js";
import { sb_address, sb_some, sb_string, sb_struct } from "../types/zod.js";
import { handleDoubleMapEntries } from "./_common.js";

// ==== Namespaces ====

export const sb_namespace_path = sb_string.transform((path, ctx) => {
  const [err, segments] = validateNamespacePath(path);
  if (err !== undefined) {
    ctx.addIssue({
      code: "custom",
      path: ctx.path,
    });
  }
  return segments;
});

const NAMESPACE_OWNERSHIP_SCHEMA = sb_struct({
  System: z.unknown(),
  Account: sb_address,
});

export async function queryNamespaceEntriesOf(
  api: ApiPromise,
  agent: SS58Address,
) {
  const [queryErr, queryRes] = await tryAsync(
    api.query.torus0.namespaces.entries(agent),
  );
  if (queryErr !== undefined) {
    throw queryErr;
  }

  const [handleError, result] = trySync(() =>
    handleDoubleMapEntries(
      queryRes,
      NAMESPACE_OWNERSHIP_SCHEMA,
      sb_namespace_path,
      sb_some(z.unknown()),
    ),
  );
}
