import { U8aFixed } from "@polkadot/types";
import type { H256 } from "@polkadot/types/interfaces";
import type { Extends } from "tsafe";
import { assert } from "tsafe";
import { z } from "zod";

// ==== 256-bit Hash ====

/**
 * Parser that converts Substrate `H256` to hex string `0x${string}`.
 */
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

assert<Extends<HexH256, `0x${string}`>>();

/**
 * Schema validator for hex-encoded `H256` strings (64 hex chars with 0x prefix).
 */
export const H256_HEX = z.string().regex(/^0x[a-fA-F0-9]{64}$/);
