import { toNano } from "@torus-ts/utils/subspace";

/**
 * Check if the provided amount is greater than zero.
 */
export function isAmountPositive(amount: string): boolean {
  return toNano(amount) > 0n;
}

/**
 * Check if the amount meets or exceeds the minimum stake requirement.
 */
export function meetsMinimumStake(amount: string, minStake: bigint): boolean {
  if (minStake < 0n) {
    return false;
  }
  try {
    return toNano(amount) >= minStake;
  } catch {
    return false;
  }
}

/**
 * Ensure that after subtracting the stake and fee, the balance remains above the existential deposit.
 */
export function isAboveExistentialDeposit(
  amount: string,
  fee: string,
  freeBalance: bigint,
  existentialDeposit: bigint
): boolean {
  if (freeBalance < 0n || existentialDeposit < 0n) {
    return false;
  }
  try {
    const stake = toNano(amount);
    const feeNano = toNano(fee);
    // Check for potential overflow
    if (stake > freeBalance || feeNano > (freeBalance - stake)) {
      return false;
    }
    return freeBalance - stake - feeNano >= existentialDeposit;
  } catch {
    return false;
  }
}

/**
 * Ensure the amount does not exceed the maximum allowed based on the free balance, fee, and existential deposit.
 */
/**
 * Ensure the amount does not exceed the maximum allowed based on the free balance, fee, and existential deposit.
 */
export function doesNotExceedMaxStake(
  amount: string,
  fee: string,
  freeBalance: bigint,
  existentialDeposit: bigint
): boolean {
  if (freeBalance < 0n || existentialDeposit < 0n) {
    return false;
  }
  try {
    const stake = toNano(amount);
    const feeNano = toNano(fee);
    // Check if feeNano + existentialDeposit would overflow
    if (feeNano > freeBalance || existentialDeposit > (freeBalance - feeNano)) {
      return false;
    }
    const maxStake = freeBalance - feeNano - existentialDeposit;
    return stake <= maxStake;
  } catch {
    return false;
  }
}
/**
 * A generic function to determine whether the amount is within the allowed transferable limit.
 */
export function isWithinTransferLimit(
  amount: string,
  fee: string,
  freeBalance: bigint
): boolean {
  const feeNano = toNano(fee);
  const maxTransferable = freeBalance > feeNano ? freeBalance - feeNano : 0n;
  return toNano(amount) <= maxTransferable;
}
