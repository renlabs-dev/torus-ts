import type { AnyJson } from "@polkadot/types/types";
import { z } from "zod";

// ==== Default toPrimitive Conversion ====

/**
 * Interface for Substrate types that can be converted to JavaScript primitives.
 */
export interface ToPrimitive {
  toPrimitive(disableAscii?: boolean): AnyJson;
}

/**
 * Schema validator for types that implement `toPrimitive()` method.
 */
export const ToPrimitive_schema = z.custom<ToPrimitive>((val) => {
  if (!(typeof val === "object" && val !== null)) {
    return false;
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (!("toPrimitive" in val && typeof val.toPrimitive === "function")) {
    return false;
  }
  return true;
}, "doesn't have .toPrimitive()");

/**
 * @deprecated Use more specific schemas
 */
export const sb_to_primitive = ToPrimitive_schema.transform((val) =>
  val.toPrimitive(),
);

// ==== ToBigInt Interface ====

/**
 * Interface for Substrate types that can be converted to JavaScript `bigint`.
 */
export interface ToBigInt {
  toBigInt(): bigint;
}

/**
 * @deprecated Use `AbstractInt_schema` or similar.
 */
export const ToBigInt_schema = z.custom<ToBigInt>((val) => {
  if (!(typeof val === "object" && val !== null)) {
    return false;
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (!("toBigInt" in val && typeof val.toBigInt === "function")) {
    return false;
  }
  return true;
});
