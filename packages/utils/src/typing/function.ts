/* eslint-disable @typescript-eslint/no-explicit-any */
// ReturnTypeOverloaded - extracts all possible return types from overloaded functions

import type { Equals as Eq } from "tsafe";
import { assert } from "tsafe";
import type { IsEqual } from "type-fest";

import type { Nat, Succ, ToNum, Zero } from "./nat";

declare const _default: unique symbol;
/**
 * Placeholder type to represent the default "not provided" value.
 */
type Default = typeof _default;

/**
 * Extracts all possible return types from an overloaded function
 *
 * It's different from TypeScript's built-in `ReturnType`, which handles only
 * one signature.
 *
 * Handles up to **16** overloaded signatures.
 *
 * @example
 * ```ts
 * function f(a: number): "R_number";
 * function f(a: string): "R_string";
 * type R = AllReturnTypeOverloaded<typeof f>; // "R_number" | "R_string"
 * ```
 *
 * @template T - The function type to extract return types from
 * @returns A union of all possible return types from all overloaded signatures
 */
export type AllReturnTypeOverloaded<T extends (...args: any) => any> =
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
    ?
        | R0
        | R1
        | R2
        | R3
        | R4
        | R5
        | R6
        | R7
        | R8
        | R9
        | R10
        | R11
        | R12
        | R13
        | R14
        | R15
    : never;

/**
 * Extracts return types from an overloaded function for a given argument
 * signature.
 *
 * It's different from TypeScript's built-in `ReturnType`, which handles only
 * one signature. Unlike `AllReturnTypeOverloaded`, this utility can extract
 * return types for specific combinations of argument types instead of
 * all possible return types.
 *
 * Returns the union of return types corresponding to the signatures matching
 * the given type argument. Returns `never` when no signature matches the
 * provided argument types.
 *
 * Handles up to **16** overloaded signatures.
 *
 * @example
 * ```ts
 * function f(a: number): "R_number";
 * function f(a: string): "R_string";
 *
 * type R1 = ReturnTypeOverloaded<typeof f, [number]>; // "R_number"
 * type R2 = ReturnTypeOverloaded<typeof f, [string]>; // "R_string"
 * type R3 = ReturnTypeOverloaded<typeof f, [number | string]>; // "R_number" | "R_string"
 * type R4 = ReturnTypeOverloaded<typeof f, [boolean]>; // never
 * ```
 *
 * @template T - The function type to extract return types from
 * @template Args - Tuple type representing the argument types to match against
 * @returns The return types of signatures that accept the argument types
 */
export type ReturnTypeOverloaded<
  T extends (...args: any) => any,
  Args extends any[],
> =
  // 16 cases
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
    ?
        | (Args extends A0 ? R0 : never)
        | (Args extends A1 ? R1 : never)
        | (Args extends A2 ? R2 : never)
        | (Args extends A3 ? R3 : never)
        | (Args extends A4 ? R4 : never)
        | (Args extends A5 ? R5 : never)
        | (Args extends A6 ? R6 : never)
        | (Args extends A7 ? R7 : never)
        | (Args extends A8 ? R8 : never)
        | (Args extends A9 ? R9 : never)
        | (Args extends A10 ? R10 : never)
        | (Args extends A11 ? R11 : never)
        | (Args extends A12 ? R12 : never)
        | (Args extends A13 ? R13 : never)
        | (Args extends A14 ? R14 : never)
        | (Args extends A15 ? R15 : never)
    : never;

export type NthReturnTypeOverloaded<
  T extends (...args: any) => any,
  // Argument types to match against
  Args extends any[],
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
 * Returns a tuple of [args, returnType] pairs representing unique signatures
 * after removing consecutive duplicates from the beginning.
 *
 * If Args is provided, returns only signatures whose argument types match the given Args.
 *
 * Handles up to **16** overloaded signatures.
 *
 * @example
 * ```ts
 * function f(a: number): "R_number";
 * function f(a: number): "R_number"; // duplicate
 * function f(a: string): "R_string";
 *
 * // Results in [[[number], "R_number"], [[string], "R_string"]]
 * type Sigs = ExtractSignatures<typeof f>;
 *
 * // Results in [[[number], "R_number"]]
 * type NumSigs = ExtractSignatures<typeof f, [number]>;
 * ```
 *
 * @template T - The function type to extract signatures from
 * @template Args - Optional. The argument types to filter signatures by
 * @returns A tuple of [args, returnType] pairs representing unique signatures
 */
export type ExtractSignatures<
  T extends (...args: any) => any,
  Args extends any[] = [Default],
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
 * Helper type that filters signatures based on argument types
 * Only includes elements where Args extends the signature's argument types
 */
type FilterSignaturesTuple<
  Signatures extends [any[], any][],
  Args extends any[],
  Result extends [any[], any][] = [],
> =
  // If there's at least one element in the tuple
  Signatures extends [
    infer First extends [any[], any],
    ...infer Rest extends [any[], any][],
  ]
    ? // If the first element's argument types match Args
      Args extends First[0]
      ? FilterSignaturesTuple<Rest, Args, [...Result, First]>
      : FilterSignaturesTuple<Rest, Args, Result>
    : Result;

declare function _extractSignaturesExample(a: number): "R_number";
declare function _extractSignaturesExample(a: number): "R_number"; // duplicate
declare function _extractSignaturesExample(a: string): "R_string";
function _extractSignaturesExample_test(): void {
  type Fn = typeof _extractSignaturesExample;
  type AllSigs = ExtractSignatures<Fn>;
  assert<Eq<AllSigs, [[[number], "R_number"], [[string], "R_string"]]>>();
  assert<Eq<ExtractSignatures<Fn, [number]>, [[[number], "R_number"]]>>();
}

/**
 * Helper type to find the Nth matching return type
 */
type FindNthMatchingType<
  Signatures extends [any[], any][],
  MatchArgs extends any[],
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
 * Drops elements from the beginning of a tuple as long as consecutive
 * elements are equal.
 *
 * This type recursively checks if the first two elements of the tuple are
 * equal. If they are, it drops the first element and continues the process.
 * The dropping stops when it encounters two consecutive elements that are not
 * equal.
 *
 * @template T - The input tuple type
 * @returns A tuple with consecutive equal elements at the beginning dropped
 *
 * @example
 * // Returns [1, 2, 3]
 * type Result1 = DropWhileEqual<[1, 1, 1, 2, 3]>;
 *
 * @example
 * // Returns [1, 2, 3] (no dropping because 1 !== 2)
 * type Result2 = DropWhileEqual<[1, 2, 3]>;
 */
type DropWhileEqual<T extends any[]> =
  // If tuple has at least 2 elements
  T extends [infer H1, infer H2, ...infer Tail]
    ? // and the first two elements are equal
      IsEqual<H1, H2> extends true
      ? // drops one element
        DropWhileEqual<[H2, ...Tail]>
      : T
    : T;

assert<Eq<DropWhileEqual<[1, 1, 1, 2, 3]>, [1, 2, 3]>>();
assert<Eq<DropWhileEqual<[1, 2, 3]>, [1, 2, 3]>>();
assert<Eq<DropWhileEqual<[1, 1, 2, 3, 4, 4, 5]>, [1, 2, 3, 4, 4, 5]>>();

// ==== Tests ====

declare function _single(): "unit";
declare function _single_1_arg(arg: number): "unit_1";

// Example overloaded function
export function _simple(input: number): "number";
export function _simple(input: string): "string";
export function _simple(input: boolean): "boolean";
export function _simple(
  input: string | number | boolean,
): number | string | object {
  return typeof input;
}

// Multiple matches for same argument type
declare function _multiMatch(a: string): "foo";
declare function _multiMatch(a: number): "first";
declare function _multiMatch(a: number): "second";
declare function _multiMatch(a: number): "third";

// Create a more complex overloaded function for testing
declare function _complex(a: number): "result0";
declare function _complex(a: number): "result0";
declare function _complex(a: number): "result1";
declare function _complex(a: string): "result2";
declare function _complex(a: string): "result3";
declare function _complex(a: number, b: string): "result4";
declare function _complex(a: number, b: number): "result5";
declare function _complex(a: string, b: number): "result6";
declare function _complex(a: number, b: number): "result7";
declare function _complex(a: number, b: string): "result8";
declare function _complex(a: string, b: number): "result9";
declare function _complex(a: string): "result10";
declare function _complex(a: boolean): "result11";
declare function _complex(a: boolean): "result12";
declare function _complex(a: number, b: string): "result14";

// For testing optional parameters
declare function _withOptional(a: number): "required";
declare function _withOptional(a: number, b?: string): "optional";

// For testing rest parameters
declare function _withRest(a: number, ...rest: string[]): "withRest";

// For testing void and never returns
declare function _returnsVoid(): void;
declare function _returnsNever(): never;

// For testing complex types
declare function _complex2(a: { id: number }): "object";
declare function _complex2(a: number[]): "array";

function _test(): void {
  // Shorter alias
  type NthRet<
    T extends (...args: any) => any,
    Args extends any[],
    N extends number,
  > = NthReturnTypeOverloaded<T, Args, N>;

  // Correctly extracts return type for non-overloaded functions (all signatures version)
  assert<Eq<AllReturnTypeOverloaded<typeof _single>, "unit">>();
  assert<Eq<AllReturnTypeOverloaded<typeof _single_1_arg>, "unit_1">>();

  // Correctly extracts return type from non-overloaded functions (specific signature version)
  assert<Eq<ReturnTypeOverloaded<typeof _single, []>, "unit">>();
  assert<Eq<ReturnTypeOverloaded<typeof _single_1_arg, [number]>, "unit_1">>();

  // Returns never on non-matching signature on non-overloaded functions
  assert<Eq<ReturnTypeOverloaded<typeof _single_1_arg, []>, never>>();
  assert<Eq<ReturnTypeOverloaded<typeof _single_1_arg, [string]>, never>>();

  // The undesired behavior of the built-in ReturnType
  assert<Eq<ReturnType<typeof _simple>, "boolean">>();

  // Correctly extracts all return types from overloaded functions
  assert<
    Eq<AllReturnTypeOverloaded<typeof _simple>, "number" | "string" | "boolean">
  >();

  // Correctly extracts return type from overloaded functions
  type _TestA1 = ReturnTypeOverloaded<typeof _simple, [string]>;
  assert<Eq<_TestA1, "string">>();
  type _TestA2 = ReturnTypeOverloaded<typeof _simple, [number]>;
  assert<Eq<_TestA2, "number">>();
  type _TestA3 = ReturnTypeOverloaded<typeof _simple, [boolean]>;
  assert<Eq<_TestA3, "boolean">>();

  // Returns never on non-matching signature on overloaded functions
  assert<Eq<ReturnTypeOverloaded<typeof _simple, []>, never>>();
  assert<Eq<ReturnTypeOverloaded<typeof _simple, [bigint]>, never>>();

  // Testing void and never returns
  assert<Eq<AllReturnTypeOverloaded<typeof _returnsVoid>, void>>();
  assert<Eq<AllReturnTypeOverloaded<typeof _returnsNever>, never>>();
  assert<Eq<ReturnTypeOverloaded<typeof _returnsVoid, []>, void>>();
  assert<Eq<ReturnTypeOverloaded<typeof _returnsNever, []>, never>>();

  // Testing complex types
  assert<
    Eq<ReturnTypeOverloaded<typeof _complex2, [{ id: number }]>, "object">
  >();
  assert<Eq<ReturnTypeOverloaded<typeof _complex2, [number[]]>, "array">>();

  //

  // --- Tests for `NthReturnTypeOverloaded` ---

  //

  assert<Eq<NthRet<typeof _multiMatch, [string], 0>, "foo">>();
  assert<Eq<NthRet<typeof _multiMatch, [string], 1>, never>>();
  assert<Eq<NthRet<typeof _multiMatch, [number], 0>, "first">>();
  assert<Eq<NthRet<typeof _multiMatch, [number], 1>, "second">>();
  assert<Eq<NthRet<typeof _multiMatch, [number], 2>, "third">>();
  assert<Eq<NthRet<typeof _multiMatch, [number], 3>, never>>();

  // Basic tests - extract specific overload
  assert<Eq<NthRet<typeof _simple, [number], 0>, "number">>();
  assert<Eq<NthRet<typeof _simple, [string], 0>, "string">>();
  assert<Eq<NthRet<typeof _simple, [boolean], 0>, "boolean">>();
  assert<Eq<NthRet<typeof _simple, [number, string], 0>, never>>();

  // Additional edge case tests

  // Testing optional parameters
  assert<Eq<NthRet<typeof _withOptional, [number], 0>, "required">>();
  assert<Eq<NthRet<typeof _withOptional, [number, string], 0>, "optional">>();
  assert<
    Eq<NthRet<typeof _withOptional, [number, undefined], 0>, "optional">
  >();

  // Testing rest parameters
  assert<Eq<NthRet<typeof _withRest, [number], 0>, "withRest">>();
  assert<Eq<NthRet<typeof _withRest, [number, string], 0>, "withRest">>();
  assert<
    Eq<NthRet<typeof _withRest, [number, string, string], 0>, "withRest">
  >();

  // Test with more complex overloaded function
  assert<Eq<NthRet<typeof _complex, [number], 0>, "result0">>();
  assert<Eq<NthRet<typeof _complex, [number], 1>, "result1">>();
  assert<Eq<NthRet<typeof _complex, [string], 0>, "result2">>();
  assert<Eq<NthRet<typeof _complex, [string], 1>, "result3">>();
  assert<Eq<NthRet<typeof _complex, [number, string], 0>, "result4">>();
  assert<Eq<NthRet<typeof _complex, [number, number], 0>, "result5">>();
  assert<Eq<NthRet<typeof _complex, [string, number], 0>, "result6">>();
  assert<Eq<NthRet<typeof _complex, [number, number], 1>, "result7">>();
  assert<Eq<NthRet<typeof _complex, [number, string], 1>, "result8">>();
  assert<Eq<NthRet<typeof _complex, [string, number], 1>, "result9">>();
  assert<Eq<NthRet<typeof _complex, [string], 2>, "result10">>();
  assert<Eq<NthRet<typeof _complex, [boolean], 0>, "result11">>();
  assert<Eq<NthRet<typeof _complex, [boolean], 1>, "result12">>();
  assert<Eq<NthRet<typeof _complex, [number, string], 2>, "result14">>();

  assert<Eq<NthRet<typeof _complex, [number, string], 3>, never>>();
  assert<Eq<NthRet<typeof _complex, [string, number], 3>, never>>();

  assert<Eq<NthRet<typeof _complex, [number, string], 1 | 2>, "result8">>();

  // Out of bounds N should return never
  assert<Eq<NthRet<typeof _simple, [number], 1>, never>>();
  // Non-matching argument type should return never
  assert<Eq<NthRet<typeof _simple, [object], 0>, never>>();
  // Non-matching argument count should return never
  assert<Eq<NthRet<typeof _simple, [number, string], 0>, never>>();

  //

  // ---- Tests for ExtractSignatures ----

  type SingleSig = ExtractSignatures<typeof _single>;
  assert<Eq<SingleSig, [[[], "unit"]]>>();

  type SimpleSigs = ExtractSignatures<typeof _simple>;
  assert<
    Eq<
      SimpleSigs,
      [[[number], "number"], [[string], "string"], [[boolean], "boolean"]]
    >
  >();

  type MultiMatchSigs = ExtractSignatures<typeof _multiMatch>;
  assert<
    Eq<
      MultiMatchSigs,
      [
        [[string], "foo"],
        [[number], "first"],
        [[number], "second"],
        [[number], "third"],
      ]
    >
  >();

  type ComplexSigs = ExtractSignatures<typeof _complex>;
  // The duplicated signatures have been removed from the beginning
  assert<Eq<ComplexSigs[0], [[number], "result0"]>>();
  assert<Eq<ComplexSigs[1], [[number], "result1"]>>();
  assert<Eq<ComplexSigs[2], [[string], "result2"]>>();

  type FilteredSigs = ExtractSignatures<typeof _complex, [number]>;
  assert<Eq<FilteredSigs, [[[number], "result0"], [[number], "result1"]]>>();
}
