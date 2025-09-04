import { Bytes, U8aFixed } from "@polkadot/types";
import { u8aToBn } from "@polkadot/util";
import { z } from "zod";

// ==== Bytes ====

/**
 * Schema validator for Substrate `Bytes` types.
 */
export const Bytes_schema = z.custom<Bytes>(
  (val) => val instanceof Bytes,
  "not a substrate Bytes",
);

// ==== Uint Array ====

/**
 * Schema validator for Substrate `U8aFixed` types.
 */
export const U8aFixed_schema = z.custom<U8aFixed>(
  (val) => val instanceof U8aFixed,
  "not a U8aFixed",
);

/**
 * Parser that converts Substrate `U8aFixed` to JavaScript `Uint8Array`.
 */
export const sb_u8a = U8aFixed_schema.transform((val) => val.toU8a());

/**
 * Parser that converts `U8aFixed` to `BN` (big number) using little-endian format.
 */
export const sb_u8a_fixed_to_bn = sb_u8a.transform((val) =>
  u8aToBn(val, { isLe: true, isNegative: false }),
);
