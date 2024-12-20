// == Address ==

import { BN } from "@polkadot/util";

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

// == Amounts ==

const DECIMALS_MULTIPLIER = new BN("1000000000");

/**
 * Converts a nano value to its standard unit representation
 * @param nanoValue - The value in nano units (as a number, string, or BN)
 * @param decimals - Number of decimal places to round to (default: 6)
 * @returns The value in standard units as a string
 */
export function fromNano(
  nanoValue: number | string | bigint | BN,
  decimals = 9,
): string {
  const bnValue = new BN(nanoValue.toString());
  const integerPart = bnValue.div(DECIMALS_MULTIPLIER);
  const fractionalPart = bnValue.mod(DECIMALS_MULTIPLIER);

  const fractionalStr = fractionalPart.toString().padStart(9, "0");
  const roundedFractionalStr = fractionalStr.slice(0, decimals);

  return `${integerPart.toString()}.${roundedFractionalStr}`;
}

/**
 * Converts a standard unit value to nano
 * @param standardValue - The value in standard units (as a number or string)
 * @returns The value in nano units as a bigint
 */
export function toNano(standardValue: number | string): bigint {
  const [integerPart, fractionalPart = ""] = standardValue
    .toString()
    .split(".");
  const paddedFractionalPart = fractionalPart.padEnd(9, "0");
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

/**
 * TODO: rename to `toNano`
 * TODO: `number` input
 */
export function toNano2(amount: string | number): bigint {
  return BigInt(amount) * 10n ** 9n;
}
