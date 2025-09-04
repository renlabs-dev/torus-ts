import { BTreeSet } from "@polkadot/types";
import type { ZodType } from "zod";
import { z } from "zod";

// ==== Array ====

/**
 * Schema validator for Substrate `BTreeSet` types.
 */
export const BTreeSet_schema = z.custom<BTreeSet>(
  (val) => val instanceof BTreeSet,
);

/**
 * Parser for Substrate arrays, `Set`, or `BTreeSet` collections.
 *
 * Converts to JavaScript `Array` with validated elements.
 */
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
            code: "custom",
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            message: `Error in array element ${i}: ${result.error.message}`,
          });
          return;
        }
        xs.push(result.data);
      });
      return xs;
    });

// ==== Map ====

/**
 * Schema validator for JavaScript `Map` types.
 */
const Map_schema = z.custom<Map<unknown, unknown>>(
  (val) => val instanceof Map,
  "not a Map",
);

/**
 * Parser for JavaScript `Map` with validated keys and values.
 */
export const sb_map = <
  K,
  V,
  KS extends z.ZodType<K, z.ZodTypeDef, unknown>,
  VS extends z.ZodType<V, z.ZodTypeDef, unknown>,
>(
  keySchema: KS,
  valueSchema: VS,
): z.ZodType<
  Map<z.output<KS>, z.output<VS>>,
  z.ZodTypeDef,
  Map<unknown, unknown>
> => {
  return Map_schema.transform((val, ctx) => {
    const result = new Map<K, V>();
    for (const [keyRaw, valueRaw] of val) {
      const parsedKey = keySchema.safeParse(keyRaw);
      if (parsedKey.success === false) {
        ctx.addIssue({
          code: "custom",
          message: `Error in map key: ${parsedKey.error.message}`,
        });
        return z.NEVER;
      }
      const parsedValue = valueSchema.safeParse(valueRaw);
      if (parsedValue.success === false) {
        ctx.addIssue({
          code: "custom",
          message: `Error in map value: ${parsedValue.error.message}`,
        });
        return z.NEVER;
      }

      const key = parsedKey.data;
      const value = parsedValue.data;

      result.set(key, value);
    }

    return result;
  });
};
