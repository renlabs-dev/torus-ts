import { z } from "zod";
import { sb_bigint, sb_number } from "./zod";
import type { Param0 } from "tsafe/Param0";

export const uint = (p?: Param0<typeof z.number>, message?: string) =>
  z.number(p).int(message).nonnegative(message);

export const sb_id = sb_number.pipe(uint());
export type Id = z.infer<typeof sb_id>;

export const sb_blocks = sb_number.pipe(uint());
export type Blocks = z.infer<typeof sb_blocks>;

export const sb_balance = sb_bigint.pipe(z.bigint().nonnegative());
export type Balance = z.infer<typeof sb_balance>;

export const sb_amount = sb_bigint.pipe(z.bigint());
export type Amount = z.infer<typeof sb_amount>;
