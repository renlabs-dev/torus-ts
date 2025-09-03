import type { ApiPromise } from "@polkadot/api";
import type { ApiDecoration } from "@polkadot/api/types";
import { U8aFixed } from "@polkadot/types";
import type { H256 } from "@polkadot/types/interfaces";
import { z } from "zod";
import { sb_bigint, sb_number } from "../../types/zod.js";

// ==== API Types ====

export type Api = ApiDecoration<"promise"> | ApiPromise;

// ==== Hash ====

export const sb_h256 = z
  .custom<H256>((value) => {
    if (!(value instanceof U8aFixed)) {
      return false;
    }
    if (value.length !== 32) {
      return false;
    }
    return true;
  })
  .transform((value) => value.toHex());

export type HexH256 = z.infer<typeof sb_h256>;

export const H256_HEX = z.string().regex(/^0x[a-fA-F0-9]{64}$/);

// ==== Numbers ====

export const sb_id = sb_number.pipe(z.number().int().nonnegative());
export type Id = z.infer<typeof sb_id>;

export const sb_blocks = sb_number.pipe(z.number().int().nonnegative());
export type Blocks = z.infer<typeof sb_blocks>;

export const sb_balance = sb_bigint;
export type Balance = z.infer<typeof sb_balance>;
