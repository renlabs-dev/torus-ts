/**
 * Custom hook to calculate post-penalty emission percentage
 * Formula: pre-penalty % * (1 - penalty%)
 */
export function usePostPenaltyEmission(
  prePenaltyPercent: number | null | undefined,
  penaltyFactor: number | null | undefined,
): number {
  if (prePenaltyPercent == null) return 0;
  if (penaltyFactor == null) return prePenaltyPercent;
  const p = penaltyFactor > 1 ? penaltyFactor / 100 : penaltyFactor;
  return prePenaltyPercent * (1 - p);
}

/**
 * Utility function for non-hook contexts
 */
export function calculatePostPenaltyEmission(
  prePenaltyPercent: number | null | undefined,
  penaltyFactor: number | null | undefined,
): number {
  if (prePenaltyPercent == null) return 0;
  if (penaltyFactor == null) return prePenaltyPercent;
  const p = penaltyFactor > 1 ? penaltyFactor / 100 : penaltyFactor;
  return prePenaltyPercent * (1 - p);
}
