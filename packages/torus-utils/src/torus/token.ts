import { BigNumber } from "bignumber.js";
import type { Equals, Extends, Not } from "tsafe";
import { assert } from "tsafe";

import { buildTaggedBigNumberClass } from "../bignumber.js";
import type { Brand } from "../index.js";
import { DECIMALS } from "./constants.js";

// Re-export legacy functions for backward compatibility
export { formatToken, fromNano, toNano } from "./legacy.js";

/**
 * Branded type representing an amount in Rems (smallest unit).
 * 1 TORUS = 10^18 Rems
 */
export type RemAmount = Brand<"RemAmount", bigint>;

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

/**
 * Tagged BigNumber class for TORUS token amounts.
 * Provides type-safe arithmetic operations for token values.
 */
export const { Type: TorAmount, make: makeTorAmount } =
  buildTaggedBigNumberClass<"TorAmount">("TorAmount", TorBigNumberCfg);

export type TorAmount = ReturnType<typeof makeTorAmount>;

/**
 * BigNumber multiplier for decimal conversions.
 * Equals 10^18 for converting between TORUS and Rems.
 */
export const DECIMALS_BN_MULTIPLIER = makeTorAmount(10).pow(DECIMALS);

/**
 * Converts Rems to its standard unit (TORUS) representation.
 *
 * @param value - Amount in Rems (smallest unit)
 * @returns Amount in TORUS as a TorAmount
 *
 * @example
 * ```ts
 * fromRems(1000000000000000000n) // 1 TORUS
 * fromRems(500000000000000000n)  // 0.5 TORUS
 * ```
 */
export function fromRems(value: bigint): TorAmount {
  const val = makeTorAmount(value);
  return val.div(DECIMALS_BN_MULTIPLIER);
}

/**
 * Converts standard unit (TORUS) representation value to Rems.
 *
 * @param amount - Amount in TORUS
 * @returns Amount in Rems (smallest unit)
 *
 * @example
 * ```ts
 * toRems(makeTorAmount("1"))   // 1000000000000000000n
 * toRems(makeTorAmount("0.5")) // 500000000000000000n
 * ```
 */
export function toRems(amount: TorAmount): bigint {
  return BigInt(amount.times(DECIMALS_BN_MULTIPLIER).toString());
}

/**
 * Parse a string representing a TORUS token amount.
 *
 * @param txt - String representation of token amount
 * @returns Parsed amount as TorAmount
 *
 * @example
 * ```ts
 * parseTorusTokens("123.45")  // 123.45 TORUS
 * parseTorusTokens("0.001")   // 0.001 TORUS
 * ```
 */
export function parseTorusTokens(txt: string): TorAmount {
  // TODO: improve parsing?
  return makeTorAmount(txt);
}

/**
 * Convert TORUS token amount into string with given amount of decimal places.
 *
 * @param value - Token amount to format
 * @param decimalPlaces - Number of decimal places to display (default: 2)
 * @returns Formatted string representation
 *
 * @example
 * ```ts
 * formatTorusToken(makeTorAmount("123.456"), 2) // "123.46"
 * formatTorusToken(makeTorAmount("0.1"), 4)     // "0.1000"
 * ```
 */
export function formatTorusToken(value: TorAmount, decimalPlaces = 2) {
  return value.toFixed(decimalPlaces);
}

// Type safety test - ensures TorAmount is properly branded
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
