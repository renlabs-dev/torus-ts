import type { Brand } from "./";
import { buildTaggedBigNumberClass } from "./bignumber";
import { BigNumber } from "bignumber.js";
import type { Equals, Extends, Not } from "tsafe";
import { assert } from "tsafe";

export const DECIMALS = 18;

export const DECIMALS_BIG = BigInt(DECIMALS);
export const DECIMALS_MULTIPLIER = 10n ** DECIMALS_BIG;

// ==== Address ====

/**
 * Returns a shortened version of the given address.
 *
 * @param address - The address to be shortened.
 * @param size - The number of characters to keep from the start and end of the address. Default is 8.
 * @returns The shortened address.
 */
export function smallAddress(address: string, size?: number): string {
  return `${address.slice(0, size ?? 8)}…${address.slice(size ? size * -1 : -8)}`;
}

export function smallWalletName(address: string, size?: number): string {
  const effectiveSize = size ?? 8;
  if (address.length > effectiveSize) {
    return `${address.slice(0, effectiveSize)}…`;
  }
  return address;
}

// ==== Amounts ====

export type RemAmount = Brand<"RemAmount", bigint>;

// ---- Arbitrary precision decimals ----

/** 
 * Configuration for TORUS fixed point number amounts with banker's rounding.
 * 
 * We use ROUND_HALF_EVEN (banker's rounding) which is preferred for financial calculations
 * because it minimizes cumulative rounding errors when working with large sets of values.
 * 
 * Banker's rounding works as follows:
 * - Values less than half-way round down (1.4 → 1)
 * - Values greater than half-way round up (1.6 → 2)
 * - Values exactly half-way round to the nearest even number:
 *   - 1.5 rounds to 2 (nearest even number)
 *   - 2.5 rounds to 2 (nearest even number)
 *   - 3.5 rounds to 4 (nearest even number)
 *   - 4.5 rounds to 4 (nearest even number)
 * 
 * This approach distributes rounding errors evenly (up and down) compared to always
 * rounding up or down, which prevents bias when summing large sets of values.
 */
export const TorBigNumberCfg = BigNumber.clone({
  DECIMAL_PLACES: DECIMALS,
  ROUNDING_MODE: BigNumber.ROUND_HALF_EVEN, // Banker's rounding for financial calculations
});

export const { Type: TorAmount, make: makeTorAmount } =
  buildTaggedBigNumberClass<"TorAmount">("TorAmount", TorBigNumberCfg);

export type TorAmount = ReturnType<typeof makeTorAmount>;

function _test() {
  const _x = makeTorAmount(2);
  const _y = makeTorAmount(3);
  const _z = _x.plus(_y);
  type Z = typeof _z;

  // Verify that Z is exactly the TorAmount type
  assert<Equals<Z, TorAmount>>();
  // Verify that BigNumber cannot be assigned to Z (TorAmount),
  // ensuring type safety by preventing raw BigNumber operations.
  assert<Not<Extends<BigNumber, Z>>>();
}

export const DECIMALS_BN_MULTIPLIER = makeTorAmount(10).pow(DECIMALS);

// ---- DEPRECATED ----

/**
 * @deprecated
 * Converts a value in Nanos to its standard unit representation.
 *
 * @param nanoValue - The value in nano units.
 * @param roundingDecimals - Number of decimal places to round to.
 * @returns The value in standard units as a string
 */
export function fromNano(
  nanoValue: number | string | bigint,
  roundingDecimals = DECIMALS,
): string {
  const mod = (n: bigint, d: bigint) => ((n % d) + d) % d;

  const val = BigInt(nanoValue);

  const intPart = val / DECIMALS_MULTIPLIER;
  const fracPart = mod(val, DECIMALS_MULTIPLIER);

  const fractionalStr = fracPart.toString().padStart(roundingDecimals, "0");
  const roundedFractionalStr = fractionalStr.slice(0, roundingDecimals);

  return `${intPart}.${roundedFractionalStr}`;
}

/**
 * @deprecated
 * Converts a standard unit value to Nanos.
 *
 * @param standardValue - The value in standard units (as a number or string)
 * @returns The value in nano units as a bigint
 */
export function toNano(standardValue: number | string): bigint {
  const [integerPart, fractionalPart = ""] = standardValue
    .toString()
    .split(".");
  const paddedFractionalPart = fractionalPart.padEnd(DECIMALS, "0");
  const nanoValue = `${integerPart}${paddedFractionalPart}`;
  return BigInt(nanoValue);
}

export function formatToken(nano: number | bigint, decimalPlaces = 2): string {
  const fullPrecisionAmount = fromNano(nano).toString();
  const [integerPart = "0", fractionalPart = ""] =
    fullPrecisionAmount.split(".");

  const formattedIntegerPart = Number(integerPart).toLocaleString("en-US");
  const roundedFractionalPart = fractionalPart
    .slice(0, decimalPlaces)
    .padEnd(decimalPlaces, "0");

  return `${formattedIntegerPart}.${roundedFractionalPart}`;
}

// ---- NEW ----

/**
 * Converts Rems to its standard unit (TORUS) representation.
 */
export function fromRems(value: bigint): TorAmount {
  const val = makeTorAmount(value);
  return val.div(DECIMALS_BN_MULTIPLIER);
}

/**
 * Converts standard unit (TORUS) representation value to Rems.
 */
export function toRems(amount: TorAmount): bigint {
  return BigInt(amount.times(DECIMALS_BN_MULTIPLIER).toString());
}

/**
 * Parse a string representing a TORUS token amount.
 */
export function parseTorusTokens(txt: string): TorAmount {
  // TODO: improve parsing?
  return makeTorAmount(txt);
}

/**
 * Convert TORUS token amount into string with given amount of decimal places.
 */
export function formatTorusToken(value: TorAmount, decimalPlaces = 2) {
  return value.toFixed(decimalPlaces);
}
