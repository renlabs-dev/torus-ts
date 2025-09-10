import { bool, Int, Null, UInt } from "@polkadot/types";
import { AbstractInt } from "@polkadot/types-codec/abstract";
import { z } from "zod";
import { ToBigInt_schema } from "./helpers.js";

// ==== Null ====

/**
 * Schema validator for Substrate `Null` types.
 */
export const Null_schema = z.custom<Null>(
  (val) => val instanceof Null,
  "not a Substrate Null",
);

/**
 * Parser that converts Substrate `Null` to JavaScript `null`.
 */
export const sb_null = Null_schema.transform((val) => val.toPrimitive());

// ==== Boolean ====

/**
 * Schema validator for Substrate `bool` types.
 */
export const bool_schema = z.custom<bool>(
  (val) => val instanceof bool,
  "not a Substrate bool",
);

/**
 * Parser that converts Substrate `bool` to JavaScript `boolean`.
 */
export const sb_bool = bool_schema.transform((val) => val.toPrimitive());

// ==== Numbers ====

/**
 * Schema validator for Substrate `AbstractInt` types.
 */
export const AbstractInt_schema = z.custom<AbstractInt>(
  (val) => val instanceof AbstractInt,
  "not a Substrate AbstractInt",
);

export const UInt_schema = z.custom<UInt>(
  (val) => val instanceof UInt,
  "not a Substrate UInt",
);

export const Int_schema = z.custom<Int>(
  (val) => val instanceof Int,
  "not a Substrate Int",
);

export const sb_uint_bn = UInt_schema.transform((val) => val.toBn());

export const sb_int_bn = Int_schema.transform((val) => val.toBn());

/**
 * Parser that converts Substrate integer types to JavaScript `bigint`.
 */
export const sb_bigint = ToBigInt_schema.transform((val) => val.toBigInt());

/**
 * Parser that converts Substrate integer types to JavaScript `number`.
 * Validates that the result is a safe integer.
 */
export const sb_number = ToBigInt_schema.transform((val, ctx): number => {
  const num = val.toBigInt();
  const result = Number(num);
  if (!Number.isSafeInteger(result)) {
    ctx.addIssue({
      code: "custom",
      message: `Expected a safe Number integer, got ${num}`,
    });
    return z.NEVER;
  }
  return result;
});

export const sb_number_int = sb_number.pipe(z.number().int());

export const sb_percent = sb_number_int.transform((val, ctx) => {
  if (val < 0 || val > 100) {
    ctx.addIssue({
      code: "custom",
      message: `Percent must be between 0 and 100`,
    });
  }
  return val;
});
