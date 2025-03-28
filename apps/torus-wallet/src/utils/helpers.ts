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
