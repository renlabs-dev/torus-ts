import { z } from "zod";
import { sb_bigint, sb_number } from "./zod";
import type { H256 } from "@polkadot/types/interfaces";
import { U8aFixed } from "@polkadot/types";

export type ZError<T = unknown> = z.ZodError<T>;

export const sb_id = sb_number.pipe(z.number().int().nonnegative());
export type Id = z.infer<typeof sb_id>;

export const sb_blocks = sb_number.pipe(z.number().int().nonnegative());
export type Blocks = z.infer<typeof sb_blocks>;

export const sb_balance = sb_bigint.pipe(z.bigint().nonnegative());
export type Balance = z.infer<typeof sb_balance>;

export const sb_amount = sb_bigint.pipe(z.bigint());
export type Amount = z.infer<typeof sb_amount>;

// TODO: refactor, move to ./zod.ts

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

export const sb_h256_hex = z.string().regex(/^0x[a-fA-F0-9]{64}$/);
