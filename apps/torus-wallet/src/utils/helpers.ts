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

export function convertTORUSToUSD(
  torusAmount: string,
  usdPrice: number,
): string {
  const parsedAmount = parseFloat(torusAmount);
  const formattedUsdPrice = usdPrice.toFixed(4);

  return (
    Math.floor(parsedAmount * parseFloat(formattedUsdPrice) * 10000) / 10000
  ).toString();
}

export function convertUSDToTorus(usdAmount: string, usdPrice: number): string {
  const parsedAmount = parseFloat(usdAmount);
  return (Math.floor((parsedAmount / usdPrice) * 10000) / 10000).toString();
}
