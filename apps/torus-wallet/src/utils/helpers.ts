import { fromNano } from "@torus-network/torus-utils/subspace";

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

function isCurrencyInputValid(torusAmount: string, usdPrice: number): boolean {
  const parsedAmount = parseFloat(torusAmount);

  if (
    isNaN(parsedAmount) ||
    isNaN(usdPrice) ||
    usdPrice <= 0 ||
    parsedAmount < 0
  ) {
    return false;
  }

  return true;
}

export function convertTORUSToUSD(
  torusAmount: string,
  usdPrice: number,
  hasMaskDecimal: boolean = true,
): string {
  const parsedAmount = parseFloat(torusAmount);

  if (!isCurrencyInputValid(torusAmount, usdPrice)) {
    return "";
  }

  const formattedUsdPrice = usdPrice.toFixed(4);

  const result = parsedAmount * parseFloat(formattedUsdPrice);

  return hasMaskDecimal
    ? (Math.floor(result * 10000) / 10000).toString()
    : result.toString();
}

export function convertUSDToTorus(usdAmount: string, usdPrice: number): string {
  const parsedAmount = parseFloat(usdAmount);

  if (!isCurrencyInputValid(usdAmount, usdPrice)) {
    return "";
  }

  return (Math.floor((parsedAmount / usdPrice) * 10000) / 10000).toString();
}
