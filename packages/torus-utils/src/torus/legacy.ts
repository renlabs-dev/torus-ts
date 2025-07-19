import { DECIMALS, DECIMALS_MULTIPLIER } from "./constants.js";

/**
 * @deprecated Use `fromRems` instead.
 *
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
 * @deprecated Use `toRems` instead.
 *
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

/**
 * @deprecated Use `formatTorusToken` instead
 * Formats a token amount from nano units to a human-readable string.
 *
 * @param nano - Amount in nano units
 * @param decimalPlaces - Number of decimal places to display (default: 2)
 * @returns Formatted string with thousands separators
 */
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
