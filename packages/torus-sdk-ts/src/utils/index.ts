import { DateTime } from "luxon";
import { assert, AssertionError } from "tsafe";

// Export all utility modules
export * from "./async-result";
export * from "./auth";
export * from "./bignumber";
export * from "./collections";
export * from "./env";
export * from "./files";
export * from "./ipfs";
export * from "./logger";
export * from "./main";
export * from "./mutation-handler";
export * from "./result";
export * from "./subspace";
export * from "./try-catch";
export * from "./typing";

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

export function getExpirationTime(
  blockNumber: number | undefined,
  expirationBlock: number,
  relative = false,
): string {
  if (!blockNumber) return "Unknown";

  const blocksRemaining = expirationBlock - blockNumber;
  const secondsRemaining = blocksRemaining * 8; // 8 seconds per block

  const expirationDate = DateTime.now().plus({ seconds: secondsRemaining });
  if (relative) {
    return expirationDate.toRelative();
  }
  return expirationDate.toLocaleString(DateTime.DATETIME_SHORT);
}

export function getCreationTime(
  blockNumber: number | undefined,
  creationBlock: number,
  relative = false,
) {
  if (!blockNumber) return "Unknown";

  const blocksAgo = blockNumber - creationBlock;
  const secondsPassed = blocksAgo * 8; // 8 seconds per block

  const creationDate = DateTime.now().minus({ seconds: secondsPassed });

  if (relative) {
    return creationDate.toRelative();
  }

  return creationDate.toLocaleString(DateTime.DATETIME_SHORT);
}