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

// ==== Function Signature Utilities ====

// Type-level Peano Naturals with tuples
type A = unknown;
export type Nat = A[];
export type Zero = [];
export type One = [A];
export type Succ<N extends Nat> = [...N, A];
export type Inc<N extends Nat> = Succ<N>;
export type ToNum<N extends Nat> = N["length"];

declare const _default: unique symbol;
/**
 * Placeholder type to represent the default "not provided" value.
 */
type Default = typeof _default;

/**
 * Extracts return types from an overloaded function for a given argument
 * signature and returns the Nth matching return type.
 * 
 * @template T - The function type to extract return types from
 * @template Args - Tuple type representing the argument types to match against
 * @template N - Index of the return type to extract (0-based)
 * @returns The Nth return type of signatures that accept the argument types
 */
export type NthReturnTypeOverloaded<
  T extends (...args: unknown[]) => unknown,
  // Argument types to match against
  Args extends unknown[],
  // Index of the return type to extract
  N extends number,
> = T extends {
  (...args: infer A0): infer R0;
  (...args: infer A1): infer R1;
  (...args: infer A2): infer R2;
  (...args: infer A3): infer R3;
  (...args: infer A4): infer R4;
  (...args: infer A5): infer R5;
  (...args: infer A6): infer R6;
  (...args: infer A7): infer R7;
  (...args: infer A8): infer R8;
  (...args: infer A9): infer R9;
  (...args: infer A10): infer R10;
  (...args: infer A11): infer R11;
  (...args: infer A12): infer R12;
  (...args: infer A13): infer R13;
  (...args: infer A14): infer R14;
  (...args: infer A15): infer R15;
}
  ? FindNthMatchingType<
      DropWhileEqual<
        [
          [A0, R0],
          [A1, R1],
          [A2, R2],
          [A3, R3],
          [A4, R4],
          [A5, R5],
          [A6, R6],
          [A7, R7],
          [A8, R8],
          [A9, R9],
          [A10, R10],
          [A11, R11],
          [A12, R12],
          [A13, R13],
          [A14, R14],
          [A15, R15],
        ]
      >,
      Args,
      N
    >
  : never;

/**
 * Extracts all signatures (argument types and return types) from an overloaded
 * function, dropping repetitions at the start.
 * 
 * @template T - The function type to extract signatures from
 * @template Args - Optional. The argument types to filter signatures by
 * @returns A tuple of [args, returnType] pairs representing unique signatures
 */
export type ExtractSignatures<
  T extends (...args: unknown[]) => unknown,
  Args extends unknown[] = [Default],
> =
  // Match function overloads
  T extends {
    (...args: infer A0): infer R0;
    (...args: infer A1): infer R1;
    (...args: infer A2): infer R2;
    (...args: infer A3): infer R3;
    (...args: infer A4): infer R4;
    (...args: infer A5): infer R5;
    (...args: infer A6): infer R6;
    (...args: infer A7): infer R7;
    (...args: infer A8): infer R8;
    (...args: infer A9): infer R9;
    (...args: infer A10): infer R10;
    (...args: infer A11): infer R11;
    (...args: infer A12): infer R12;
    (...args: infer A13): infer R13;
    (...args: infer A14): infer R14;
    (...args: infer A15): infer R15;
  }
    ? // If Args not provided, return all signatures
      Args extends [Default]
      ? DropWhileEqual<
          [
            [A0, R0],
            [A1, R1],
            [A2, R2],
            [A3, R3],
            [A4, R4],
            [A5, R5],
            [A6, R6],
            [A7, R7],
            [A8, R8],
            [A9, R9],
            [A10, R10],
            [A11, R11],
            [A12, R12],
            [A13, R13],
            [A14, R14],
            [A15, R15],
          ]
        >
      : // If Args provided, return only signatures that match Args
        FilterSignaturesTuple<
          DropWhileEqual<
            [
              [A0, R0],
              [A1, R1],
              [A2, R2],
              [A3, R3],
              [A4, R4],
              [A5, R5],
              [A6, R6],
              [A7, R7],
              [A8, R8],
              [A9, R9],
              [A10, R10],
              [A11, R11],
              [A12, R12],
              [A13, R13],
              [A14, R14],
              [A15, R15],
            ]
          >,
          Args
        >
    : // Did not match any function overloads
      [];

/**
 * Helper type to find the Nth matching return type
 */
type FindNthMatchingType<
  Signatures extends [unknown[], unknown][],
  MatchArgs extends unknown[],
  N extends number,
  Counter extends Nat = Zero,
  MatchCounter extends Nat = Zero,
> =
  // If we have reached the end of the list of signatures
  ToNum<Counter> extends Signatures["length"]
    ? // fails
      never
    : // If the current signature matches the argument types
      MatchArgs extends Signatures[ToNum<Counter>][0]
      ? // If we are in the desired index
        ToNum<MatchCounter> extends N
        ? // returns current return type
          Signatures[ToNum<Counter>][1]
        : // Otherwise, continues the search incrementing both counters
          FindNthMatchingType<
            Signatures,
            MatchArgs,
            N,
            Succ<Counter>,
            Succ<MatchCounter>
          >
      : // If the current signature does not match the argument types, increments
        // only the position counter
        FindNthMatchingType<
          Signatures,
          MatchArgs,
          N,
          Succ<Counter>,
          MatchCounter
        >;

/**
 * Helper type that filters signatures based on argument types
 * Only includes elements where Args extends the signature's argument types
 */
type FilterSignaturesTuple<
  Signatures extends [unknown[], unknown][],
  Args extends unknown[],
  Result extends [unknown[], unknown][] = [],
> =
  // If there's at least one element in the tuple
  Signatures extends [
    infer First extends [unknown[], unknown],
    ...infer Rest extends [unknown[], unknown][],
  ]
    ? // If the first element's argument types match Args
      Args extends First[0]
      ? FilterSignaturesTuple<Rest, Args, [...Result, First]>
      : FilterSignaturesTuple<Rest, Args, Result>
    : Result;

/**
 * Drops elements from the beginning of a tuple as long as consecutive
 * elements are equal.
 */
type DropWhileEqual<T extends unknown[]> =
  // If tuple has at least 2 elements
  T extends [infer H1, infer H2, ...infer Tail]
    ? // and the first two elements are equal
      H1 extends H2
      ? H2 extends H1
        ? // drops one element
          DropWhileEqual<[H2, ...Tail]>
        : T
      : T
    : T;