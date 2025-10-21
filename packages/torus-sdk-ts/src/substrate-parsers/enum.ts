import { Enum as SubstrateEnum } from "@polkadot/types";
import type { Equals } from "tsafe";
import { assert } from "tsafe";
import { z } from "zod";
import { sb_number } from "./primitives.js";
import type { ZodRawCreateParams } from "./struct.js";

export type ZodSubstrateEnumVariants = Record<string, z.ZodType>;

export type zOut<S extends z.ZodType> = z.output<S>;

export type MapZodVariantsToRaw<V extends ZodSubstrateEnumVariants> = {
  [K in keyof V & string]: Record<K, zOut<V[K]>>;
}[keyof V & string];

/**
 * Schema validator for Substrate `Enum` types.
 */
export const Enum_schema = z.custom<SubstrateEnum>(
  (val) => val instanceof SubstrateEnum,
  "not a Substrate Enum",
);

/**
 * Parser for complex Substrate `Enum` types with typed variants.
 *
 * Each variant can contain data that is validated by its associated schema.
 * The result follows the Rust-like enum pattern: `{VariantName: data}`.
 *
 * @param variants - Object mapping variant names to their schemas
 * @returns Parser that transforms to discriminated union type
 *
 * @example
 * ```ts
 * const statusEnum = sb_enum({
 *   Active: sb_struct({ since: sb_number }),
 *   Inactive: sb_null,
 *   Pending: sb_string,
 * });
 * // Returns: `{Active: {since: number}} | {Inactive: null} | {Pending: string}`
 * ```
 */
export const sb_enum = <Variants extends ZodSubstrateEnumVariants>(
  variants: Variants,
): z.ZodType<MapZodVariantsToRaw<Variants>> =>
  Enum_schema.transform((input, ctx): MapZodVariantsToRaw<Variants> => {
    // 1) Must be a polkadot-js Enum instance
    if (!(input instanceof SubstrateEnum)) {
      ctx.addIssue({
        code: "custom",
        message: "Expected Substrate Enum",
      });
      return z.NEVER; // abort parse
    }

    // 2) Variant must exist in the provided mapping
    const variantName = input.type;
    const schema = variants[variantName];
    if (!schema) {
      ctx.addIssue({
        code: "custom",
        message: `Invalid variant name '${variantName}'`,
      });
      return z.NEVER;
    }

    // 3) Parse the inner value using the chosen schema
    //    If the inner parse fails, its ZodError will bubble up correctly.
    const parsedInner = schema.parse(input.inner);

    // 4) Wrap as { Variant: value }
    return { [variantName]: parsedInner } as MapZodVariantsToRaw<Variants>;
  });

export const sb_basic_enum = <
  U extends string,
  T extends Readonly<[U, ...U[]]>,
>(
  variants: T,
  params: ZodRawCreateParams = {},
) =>
  Enum_schema.transform((val, ctx) => {
    if (!val.isBasic) {
      ctx.addIssue({
        code: "custom",
        message: `Enum is not basic (no values)`,
      });
    }
    return val.type;
  }).pipe(z.enum(variants, params));

function _test() {
  const _s1 = sb_enum({ A: sb_number, B: sb_number });
  type S1 = z.infer<typeof _s1>;
  assert<Equals<S1, { A: number } | { B: number }>>();
}
