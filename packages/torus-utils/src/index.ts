import { assert, AssertionError } from "tsafe";

export * from "./typing.js";

// == Branded Types / Nominal Types ==

export declare const BRAND_TAG_KEY: unique symbol;

export interface BrandTag<T> {
  readonly [BRAND_TAG_KEY]: T;
}

export type Brand<T, V> = BrandTag<T> & V;

// == Assertion ==

export function assertOrThrow(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new AssertionError(message);
  }
}

export const is_error = (err: unknown): err is Error => err instanceof Error;

export function assert_error(err: unknown): asserts err is Error {
  return assert(is_error(err), "Caught error is not of type Error");
}

export const is_not_null = <T>(value: T): value is NonNullable<T> =>
  value != null;

// == Objects ==

export const typed_entries = <T extends object>(obj: T) =>
  Object.entries(obj) as { [K in keyof T]: [K, T[K]] }[keyof T][];

export const typed_non_null_entries = <T extends object>(obj: T) =>
  typed_entries(obj).filter(([_, value]) => is_not_null(value)) as {
    [K in keyof T]-?: [K, NonNullable<T[K]>];
  }[keyof T][];

// == Numeric ==

export function check_int(value: unknown): bigint {
  if (typeof value === "bigint") {
    return value;
  } else if (typeof value === "number") {
    if (Number.isInteger(value)) return BigInt(value);
    else throw new Error(`Expected integer, got ${value}`);
  } else {
    throw new Error(`Expected integer`);
  }
}

export function bigintDivision(a: bigint, b: bigint, precision = 8n): number {
  if (b === 0n) return NaN;
  const base = 10n ** precision;
  return Number((a * base) / b) / Number(base);
}

// == Time ==

export { getExpirationTime, getCreationTime } from "./date-time.js";

// == String ==

/**
 * Converts a string to an array of byte values (numbers).
 *
 * Uses the TextEncoder API to encode the input string as UTF-8 bytes,
 * then converts the resulting Uint8Array to a regular number array.
 *
 * @param str - The string to convert to byte array
 * @returns An array of numbers representing the UTF-8 byte values of the input string
 *
 * @example
 * ```ts
 * const bytes = strToByteArray("Hello");
 * // Returns: [72, 101, 108, 108, 111]
 * ```
 */
export const strToByteArray = (str: string): number[] => {
  const encoder = new TextEncoder();
  const bytesArray = Array.from(encoder.encode(str));
  return bytesArray;
};
