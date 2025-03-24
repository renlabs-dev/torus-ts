import { fromNano } from "@torus-ts/utils/subspace";

/**
 * Returns the fee adjusted by the provided buffer percent.
 */
export function calculateAdjustedFee(
  rawFee: bigint,
  feeBufferPercent: bigint,
): bigint {
  return (rawFee * feeBufferPercent) / 100n;
}

/**
 * Returns the maximum transferable/stakable amount given the free balance and adjusted fee.
 */
export function calculateMaxTransferable(
  freeBalance: bigint,
  adjustedFee: bigint,
): bigint {
  return freeBalance > adjustedFee ? freeBalance - adjustedFee : 0n;
}

/**
 * Computes both the adjusted fee string and the maximum transferable amount string.
 */
export function computeFeeData(
  rawFee: bigint,
  feeBufferPercent: bigint,
  freeBalance: bigint,
): { feeStr: string; maxTransferable: bigint } {
  const adjustedFee = calculateAdjustedFee(rawFee, feeBufferPercent);
  const feeStr = fromNano(adjustedFee);
  const maxTransferable = calculateMaxTransferable(freeBalance, adjustedFee);
  return { feeStr, maxTransferable };
}

/**
 * Converts a Torus amount to USD value.
 * @param torusAmount - The amount in Torus as a string
 * @param usdPrice - Optional USD price of Torus
 * @returns The USD value as a string, rounded to 4 decimal places
 */
export function convertToUSD(torusAmount: string, usdPrice?: number): string {
  const parsedAmount = parseFloat(torusAmount);
  if (isNaN(parsedAmount) || usdPrice === undefined) return "0";
  const formattedUsdPrice = usdPrice.toFixed(4);
  return (Math.floor(parsedAmount * parseFloat(formattedUsdPrice) * 10000) / 10000).toString();
}

/**
 * Converts a USD amount to Torus value.
 * @param usdAmount - The amount in USD as a string
 * @param usdPrice - Optional USD price of Torus
 * @returns The Torus value as a string, rounded to 4 decimal places
 */
export function convertToTorus(usdAmount: string, usdPrice?: number): string {
  const parsedAmount = parseFloat(usdAmount);
  if (isNaN(parsedAmount) || !usdPrice) return "0";
  return (Math.floor(parsedAmount / usdPrice * 10000) / 10000).toString();
}
