import { BigNumber } from "bignumber.js";

export const DECIMALS = 18;

export const DECIMALS_BIG = BigInt(DECIMALS);
export const DECIMALS_MULTIPLIER = 10n ** DECIMALS_BIG;

// ---- Arbitrary precision decimals ----

export const TorBigNumberCfg = BigNumber.clone({
  DECIMAL_PLACES: DECIMALS,
  ROUNDING_MODE: BigNumber.ROUND_HALF_EVEN, // better for financial
});

export const TorBigNumber = (value: BigNumber.Value) =>
  new TorBigNumberCfg(value);

export const DECIMALS_BN_MULTIPLIER = TorBigNumber(10).pow(DECIMALS);

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

// ==== Amounts ====

// ---- old ----

/**
 * Converts a value in Nanos to its standard unit representation.
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
 * Converts a standard unit value to Nanos.
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

// ---- new ----

/**
 * Converts Rens to its standard unit (TORUS) representation.
 */
export function fromRen(value: bigint): BigNumber {
  const val = TorBigNumber(value.toString());
  return val.div(DECIMALS_BN_MULTIPLIER);
}

/**
 * Converts standard unit (TORUS) representation value to Rens.
 */
export function toRen(amount: BigNumber): bigint {
  return BigInt(amount.times(DECIMALS_BN_MULTIPLIER).toString());
}

/**
 * Parse a string representing a TORUS token amount.
 */
export function parseTorusTokens(txt: string): BigNumber {
  return TorBigNumber(txt);
}

/**
 * Convert TORUS token amount into string with given amount of decimal places.
 */
export function formatTorusToken(value: BigNumber, decimalPlaces = 2) {
  return value.toFixed(decimalPlaces);
}
