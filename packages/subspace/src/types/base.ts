import { z } from "zod";

import { sb_bigint, sb_number } from "./zod";

export const sb_id = sb_number.pipe(z.number().int().nonnegative());
export type Id = z.infer<typeof sb_id>;

export const sb_blocks = sb_number.pipe(z.number().int().nonnegative());
export type Blocks = z.infer<typeof sb_blocks>;

export const sb_balance = sb_bigint.pipe(z.bigint().nonnegative());
export type Balance = z.infer<typeof sb_balance>;

export const sb_amount = sb_bigint.pipe(z.bigint());
export type Amount = z.infer<typeof sb_amount>;
