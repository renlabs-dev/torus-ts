import type { Enum } from "rustie";
import { match } from "rustie";
import type { SafeParseReturnType, z } from "zod";

/**
 * A type that can be either null or undefined, used to help handle nullable or
 * optional values.
 */
export type Nullish = null | undefined;

/**
 * Extracts the type of elements from an array type.
 * If the input type is not an array, returns `never`.
 *
 * @typeParam L - The array type to extract elements from
 *
 * @example
 * type Numbers = number[];
 * type X = ListItem<Numbers>; // number
 *
 * @example
 * type NotArray = string;
 * type Y = ListItem<NotArray>; // never
 */
export type ListItem<L> = L extends (infer T)[] ? T : never;

/**
 * Forces the TypeScript compiler to emit a message containing the inferred type
 * of the input. This is a utility function used for debugging type inference
 * issues during development.
 *
 * The function doesn't modify the input value but leverages TypeScript's type
 * checking to show the inferred type in editor tooltips or compiler messages.
 *
 * @template T - The type parameter constrained to 'never' to maximize type
 * inference visibility
 * @param {T} x - The value whose type should be observed
 * @returns {T} - Returns the input value unchanged
 */
export const observeType = <T extends never>(x: T): T => x;

// == ADTs ==

// -- Option --

export type Option<T> = { None: null } | { Some: T };

export const flattenOption = <T>(x: Option<T>): T | null => {
  return match(x)({
    None() {
      return null;
    },
    Some(r) {
      return r;
    },
  });
};

// -- Result --

/**
 * @deprecated
 */
export type OldResult<T, E> = Enum<{ Ok: T; Err: E }>;

export function flattenResult<T, E>(x: OldResult<T, E>): T | null {
  return match(x)({
    Ok(r) {
      return r;
    },
    Err() {
      return null;
    },
  });
}

// ==== Zod ====

/**
 * Parse a typed value using a Zod schema, instead of accepting any value.
 */
export function parseTyped<Z extends z.ZodType<unknown>>(
  schema: Z,
  val: z.input<Z>,
): z.output<Z> {
  return schema.parse(val);
}

/**
 * SafeParse a typed value using a Zod schema, instead of accepting any value.
 */
export function safeParseTyped<Z extends z.ZodType>(
  schema: Z,
  val: z.input<Z>,
): SafeParseReturnType<z.input<Z>, z.output<Z>> {
  return schema.safeParse(val);
}
