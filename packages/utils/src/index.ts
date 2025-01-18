import { DateTime } from "luxon";
import { assert, AssertionError } from "tsafe";
import { z } from "zod";

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
  return assert(is_error(err));
}

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

// == URL ==

export const URL_SCHEMA = z.string().trim().url();

export const isNotNull = <T>(item: T | null): item is T => item !== null;

export function removeEmojisLmao(text: string): string {
  const emojiPattern =
    /[\u{1F000}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F191}-\u{1F251}\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2194}-\u{2199}\u{21A9}-\u{21AA}\u{231A}-\u{231B}\u{2328}\u{23CF}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{24C2}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2600}-\u{2604}\u{260E}\u{2611}\u{2614}-\u{2615}\u{2618}\u{261D}\u{2620}\u{2622}-\u{2623}\u{2626}\u{262A}\u{262E}-\u{262F}\u{2638}-\u{263A}\u{2640}\u{2642}\u{2648}-\u{2653}\u{265F}-\u{2660}\u{2663}\u{2665}-\u{2666}\u{2668}\u{267B}\u{267E}-\u{267F}\u{2692}-\u{2697}\u{2699}\u{269B}-\u{269C}\u{26A0}-\u{26A1}\u{26AA}-\u{26AB}\u{26B0}-\u{26B1}\u{26BD}-\u{26BE}\u{26C4}-\u{26C5}\u{26C8}\u{26CE}-\u{26CF}\u{26D1}\u{26D3}-\u{26D4}\u{26E9}-\u{26EA}\u{26F0}-\u{26F5}\u{26F7}-\u{26FA}\u{26FD}\u{2702}\u{2705}\u{2708}-\u{270D}\u{270F}]/gu;

  return text.replace(emojiPattern, "");
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

function chunkString (str: string, len: number): string[] {
  const size = Math.ceil(str.length/len)
  const r: string[] = Array<string>(size)
  let offset = 0

  for (let i = 0; i < size; i++) {
    r[i] = str.substring(offset, offset + len)
    offset += len
  }

  return r
}

export function splitAddress(address: string, len = 4) {
  return chunkString(address, len)
}
