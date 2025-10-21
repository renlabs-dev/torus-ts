import { Struct } from "@polkadot/types";
import type { Equals } from "tsafe";
import { assert } from "tsafe";
import type { Merge } from "type-fest";
import type { ZodRawShape } from "zod";
import { z } from "zod";
import type { $InferObjectOutput } from "zod/v4/core";

export const Map_schema = z.custom<Map<unknown, unknown>>(
  (val) => val instanceof Map,
  "not a Map",
);

export declare type ZodRawCreateParams =
  | {
      // errorMap?: ZodErrorMap;
      invalid_type_error?: string;
      required_error?: string;
      message?: string;
      description?: string;
    }
  | undefined;

/**
 * Similar to `z.object()` but accepts JavaScript `Map`.
 */
export const z_typed_map = <Shape extends ZodRawShape>(
  shape: Shape,
  params?: ZodRawCreateParams,
): z.ZodType<
  $InferObjectOutput<Shape, Record<never, never>>,
  Map<unknown, unknown>
> =>
  Map_schema.transform((map, ctx) => {
    const obj: Record<string, unknown> = {};
    for (const [key, value] of map.entries()) {
      if (typeof key !== "string") {
        ctx.addIssue({
          code: "custom",
          message: `Map key must be a string, number, or symbol. Received ${typeof key}`,
        });
        continue;
      }
      obj[key] = value;
    }
    return obj;
  }).pipe(z.object(shape, params));

function _test_z_typed_map() {
  const _map_schema = z_typed_map({
    a: z.string(),
    b: z.number(),
  });
  type _map_schema_out_t = z.output<typeof _map_schema>;
  assert<Equals<_map_schema_out_t, { a: string; b: number }>>();
}

// ==== Struct ====

/**
 * Schema validator for Substrate `Struct` types.
 */
export const Struct_schema = z.custom<Struct>(
  (val) => val instanceof Struct,
  "not a substrate Struct",
);

/**
 * Parser for standard Substrate `Struct` types that behave like `Map`s.
 *
 * Use this for Substrate `Struct` types where all properties are accessed via the
 * `.get(key)` / `.entries()` methods.
 *
 * @param shape - Zod schema shape defining the expected properties and their types
 * @param params - Optional Zod creation parameters (error messages, etc.)
 *
 * @example
 * ```ts
 * const parser = sb_struct({
 *   index: sb_number,
 *   name: sb_string,
 * });
 *
 * // Parses a Substrate `Struct` where:
 * // - struct.get('index') returns a number-like `Codec`
 * // - struct.get('name') returns a `Text`/`Bytes` `Codec`
 * ```
 */
export const sb_struct = <Shape extends ZodRawShape>(
  shape: Shape,
  params?: ZodRawCreateParams,
): z.ZodType<$InferObjectOutput<Shape, Record<never, never>>, Struct> =>
  Struct_schema.transform((v) => v as Map<unknown, unknown>).pipe(
    z_typed_map(shape, params),
  );

function _test_sb_struct() {
  const _struct_schema = sb_struct({
    a: z.string(),
    b: z.number(),
  });
  type _struct_schema_out_t = z.output<typeof _struct_schema>;
  assert<Equals<_struct_schema_out_t, { a: string; b: number }>>();
}

/**
 * Parser for hybrid Substrate `Struct` types that have both `Map`-like and object-like
 * properties.
 *
 * Use this for Substrate `Struct` types that extend `Map` but also have additional
 * direct properties. Some properties are accessed via `.get(key)` /
 * `.entries()` (`Map` behavior) while others are accessed directly as
 * `struct.property` (object behavior).
 *
 * @param mapShape - Schema for properties accessed like Map keys
 * @param objShape - Schema for properties accessed directly as object properties
 * @param params - Optional Zod creation parameters (error messages, etc.)
 *
 * @example
 * ```ts
 * // For a Substrate Event which has:
 * // - Map properties: index, data (accessed via event.get('index'))
 * // - Direct properties: section, method (accessed via event.section)
 * const eventParser = sb_struct_obj(
 *   {
 *     // Map properties - accessed via .get()
 *     index: z.any().optional(),
 *     data: sb_array(z.any()),
 *   },
 *   {
 *     // Direct object properties
 *     section: z.string(),
 *     method: z.string(),
 *   }
 * );
 * ```
 *
 * @remarks
 * This handles the hybrid nature of certain Substrate types like Event, which
 * extend Map for some properties but expose others as direct properties. The
 * parser extracts values from both access patterns and validates them according
 * to the provided schemas.
 */
export const sb_struct_obj = <MS extends ZodRawShape, OS extends ZodRawShape>(
  mapShape: MS,
  objShape: OS,
  params?: ZodRawCreateParams,
) =>
  Struct_schema.transform((inputValue, ctx) => {
    const obj: Record<string, unknown> = {};

    // Handle Struct as Map
    for (const key of Object.keys(mapShape)) {
      const value = inputValue.get(key);
      if (value === undefined) {
        ctx.addIssue({
          code: "custom",
          message: `Missing key ${key} in Struct (as Map)`,
          path: [key],
        });
        return z.NEVER;
      }
      obj[key] = value;
    }

    const objKeys = Object.keys(objShape);
    for (const key of objKeys) {
      const inputObj = inputValue as unknown as Record<string, unknown>;
      const val = inputObj[key];
      if (val === undefined) {
        ctx.addIssue({
          code: "custom",
          message: `Missing key ${key} in Struct`,
          path: [key],
        });
        return z.NEVER;
      }
      obj[key] = val;
    }

    return obj;
  }).pipe(z.object<Merge<MS, OS>>({ ...mapShape, ...objShape }, params));
