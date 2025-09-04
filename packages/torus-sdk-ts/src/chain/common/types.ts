import type { ApiPromise } from "@polkadot/api";
import type { ApiDecoration } from "@polkadot/api/types";
import { z } from "zod";
import { sb_bigint, sb_number } from "../../substrate-parsers/primitives.js";

// ==== API Types ====

export type Api = ApiDecoration<"promise"> | ApiPromise;

// ==== Numbers ====

export const sb_id = sb_number.pipe(z.number().int().nonnegative());
export type Id = z.infer<typeof sb_id>;

export const sb_blocks = sb_number.pipe(z.number().int().nonnegative());
export type Blocks = z.infer<typeof sb_blocks>;

export const sb_balance = sb_bigint;
export type Balance = z.infer<typeof sb_balance>;
