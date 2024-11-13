import type { ZodRawShape, ZodType } from "zod";
import { BTreeSet, Enum, GenericAccountId, UInt } from "@polkadot/types";
import { z } from "zod";

import { ADDRESS_SCHEMA } from "./address";

// == Zod ==

export declare type ZodRawCreateParams =
  | {
      // errorMap?: ZodErrorMap;
      invalid_type_error?: string;
      required_error?: string;
      message?: string;
      description?: string;
    }
  | undefined;

// == Numbers ==

export const UInt_schema = z.custom<UInt>(
  (val) => val instanceof UInt,
  "not a substrate UInt",
);

export const sb_bigint = UInt_schema.transform((val) =>
  BigInt(val.toPrimitive()),
);

// == Enum ==

export const Enum_schema = z.custom<Enum>(
  (val) => val instanceof Enum,
  "not an substrate Enum",
);

export const sb_basic_enum = (variants: [string, ...string[]]) =>
  Enum_schema.transform((val, ctx) => {
    if (!val.isBasic) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Enum is not basic (no values)`,
      });
    }
    return val.type;
  }).pipe(z.enum(variants));

// == Address ==

export const GenericAccountId_schema = z.custom<GenericAccountId>(
  (val) => val instanceof GenericAccountId,
  "not a substrate BaseAccountId",
);

export const sb_address = GenericAccountId_schema.transform((val) =>
  val.toString(),
).pipe(ADDRESS_SCHEMA);

// == Collections ==

export const BTreeSet_schema = z.custom<BTreeSet>(
  (val) => val instanceof BTreeSet,
);

interface ForEach<T> {
  forEach(
    callbackfn: (value: T, value2: T, set: ForEach<T>) => void,
    // thisArg?: any,
  ): void;
}

export const sb_array = <T, S extends ZodType<T, z.ZodTypeDef, unknown>>(
  inner: S,
): z.ZodType<z.output<S>[], z.ZodTypeDef, unknown> =>
  z
    .custom<unknown[] | Set<unknown> | BTreeSet>((val: unknown) => {
      if (Array.isArray(val)) {
        return true;
      }
      if (val instanceof Set) {
        return true;
      }
      if (val instanceof BTreeSet) {
        return true;
      }
      return false;
    })
    .transform((val, ctx): T[] => {
      const xs: T[] = [];
      val.forEach((v, i) => {
        const result = inner.safeParse(v);
        if (!result.success) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            message: `Error in array element ${i}: ${result.error.message}`,
          });
          return;
        }
        xs.push(result.data);
      });
      return xs;
    });

/**
 * Similar to `z.object()` but accepts `Map`.
 */
export const z_map = <T extends ZodRawShape>(
  shape: T,
  params?: ZodRawCreateParams,
) =>
  z
    .custom<Map<unknown, unknown>>((data) => data instanceof Map, "not a Map")
    .transform((map, ctx) => {
      const obj: Record<string | number | symbol, unknown> = {};
      for (const [key, value] of map.entries()) {
        if (
          typeof key !== "string" &&
          typeof key !== "number" &&
          typeof key !== "symbol"
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Map key must be a string, number, or symbol. Received ${typeof key}`,
          });
          continue;
        }
        obj[key] = value;
      }
      return obj;
    })
    .pipe(z.object(shape, params));
