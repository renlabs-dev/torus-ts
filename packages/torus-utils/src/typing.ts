import type { Enum } from "rustie";
import { match } from "rustie";
import type { SafeParseReturnType, z } from "zod";
import type { Result } from "./result/sync.js";
import { makeErr, makeOk } from "./result/sync.js";

/**
 * A type that can be either null or undefined, used to help handle nullable or
 * optional values.
 */
export type Nullish = null | undefined;

/**
 * A utility type that makes a type nullable by allowing it to be either the
 * original type or null.
 *
 * @example
 * ```ts
 * type User = { name: string; age: number };
 * type NullableUser = Nullable<User>; // User | null
 *
 * const user: NullableUser = null; // Valid
 * const user2: NullableUser = { name: "John", age: 30 }; // Valid
 * ```
 */
export type Nullable<T> = T | null;

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

export const typed_keys = <T extends object>(obj: T) =>
  Object.keys(obj) as (keyof T)[];

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

/**
 * Creates a curried parser from a Zod schema that returns a functional Result
 * instead of throwing.
 *
 * The returned function calls `schema.safeParse(input, params)` and:
 * - returns `[undefined, parsedValue]` when validation succeeds
 * - returns `[zodError, undefined]` when validation fails
 *
 * The returned function is generic over `Strict extends boolean` to control the
 * accepted input type:
 * - `Strict = true` enforces the schema’s inferred input type (`z.input<S>`) at
 *   the call site
 * - `Strict = false` allows a broader input type (`unknown`) like `safeParse`
 * - see {@link parseTyped} and {@link safeParseTyped}
 *
 * @typeParam O - Schema output type (equivalent to `z.output<S>`).
 * @typeParam I - Schema input type (equivalent to `z.input<S>`).
 * @typeParam S - A `z.ZodSchema` that maps `I` to `O`.
 *
 * @param schema - The Zod schema used to validate and parse inputs.
 * @param params - Optional Zod parse parameters forwarded to `safeParse` (e.g.,
 * `errorMap`, `path`).
 *
 * @returns A function `<Strict extends boolean>(input: Strict extends true ?
 * z.input<S> : I) => Result<z.output<S>, z.ZodError<z.input<S>>>`.
 *
 * @example
 * import { z } from 'zod';
 *
 * const userSchema = z.object({ name: z.string() });
 * const parseUser = zodParseResult(userSchema);
 *
 * // Default usage (Strict inferred as false)
 * const res1 = parseUser({ name: 'Ada' });
 *
 * // Enforce strict input typing at the call site
 * const res2 = parseUser<true>({ name: 'Grace' });
 *
 * // res1 and res2 are Result<{ name: string }, z.ZodError<{ name: unknown }>>
 */
export const zodParseResult =
  <O, I, S extends z.ZodSchema<O, z.ZodTypeDef, I>>(
    schema: S,
    params?: Partial<z.ParseParams>,
  ) =>
  <Strict extends boolean = false>(
    input: Strict extends true ? z.input<S> : I,
  ): Result<z.output<S>, z.ZodError<z.input<S>>> => {
    const parseRes = schema.safeParse(input, params);
    if (parseRes.success) {
      return makeOk(parseRes.data);
    }
    return makeErr<z.ZodError<z.input<S>>>(parseRes.error);
  };
