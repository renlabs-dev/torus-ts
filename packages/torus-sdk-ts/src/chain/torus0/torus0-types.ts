import type { ApiPromise } from "@polkadot/api";
import { z } from "zod";

import {
  sb_address,
  sb_bigint,
  sb_enum,
  sb_null,
  sb_number_int,
  sb_percent,
  sb_string,
  sb_struct,
} from "../../types/index.js";
import { validateNamespacePath } from "../../types/namespace/index.js";

// ==== Agents ====

export const FEES_SCHEMA = sb_struct({
  stakingFee: sb_number_int,
  weightControlFee: sb_number_int,
});

export const AGENT_SCHEMA = sb_struct({
  key: sb_address,
  name: sb_string,
  url: sb_string,
  metadata: sb_string,
  weightPenaltyFactor: sb_percent,
  registrationBlock: sb_bigint,
  fees: FEES_SCHEMA,
});

export type Agent = z.infer<typeof AGENT_SCHEMA>;

// ==== Namespace ====

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

export const NAMESPACE_OWNERSHIP_SCHEMA = sb_enum({
  System: sb_null,
  Account: sb_address,
});

export const NAMESPACE_METADATA_SCHEMA = sb_struct({
  createdAt: sb_bigint,
  deposit: sb_bigint,
});

export interface NamespaceEntry {
  path: string[];
  createdAt: bigint;
  deposit: bigint;
}

// ==== Transaction Interfaces ====

export interface RegisterAgent {
  api: ApiPromise;
  name: string;
  url: string;
  metadata: string;
}
