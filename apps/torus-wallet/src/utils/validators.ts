import { toNano } from "@torus-network/torus-utils/torus/token";

/**
 * Check if the provided amount is greater than zero.
 */
export function isAmountPositive(amount: string): boolean {
  try {
    return toNano(amount) > 0n;
  } catch {
    return false;
  }
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
  existentialDeposit: bigint,
): boolean {
  if (freeBalance < 0n || existentialDeposit < 0n) {
    return false;
  }
  try {
    const stake = toNano(amount);
    const feeNano = toNano(fee);
    // Check for potential overflow
    if (stake > freeBalance || feeNano > freeBalance - stake) {
      return false;
    }
    return freeBalance - stake - feeNano >= existentialDeposit;
  } catch {
    return false;
  }
}

/**
 * Ensure the amount does not exceed the maximum allowed based on the free balance, fee, and existential deposit.
 * @param amount - The stake amount as a string to be validated
 * @param fee - The transaction fee as a string
 * @param freeBalance - The available balance in bigint
 * @param existentialDeposit - The minimum required balance in bigint
 * @returns {boolean} True if stake is within limit, false if it exceeds maximum or if invalid
 */
export function doesNotExceedMaxStake(
  amount: string,
  fee: string,
  freeBalance: bigint,
  existentialDeposit: bigint,
): boolean {
  if (freeBalance < 0n || existentialDeposit < 0n) {
    return false;
  }
  try {
    const stake = toNano(amount);
    const feeNano = toNano(fee);
    // Check if feeNano + existentialDeposit would overflow
    if (feeNano > freeBalance || existentialDeposit > freeBalance - feeNano) {
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
  freeBalance: bigint,
): boolean {
  if (freeBalance < 0n) {
    return false;
  }
  try {
    const feeNano = toNano(fee);
    if (feeNano > freeBalance) {
      return false;
    }
    const maxTransferable = freeBalance > feeNano ? freeBalance - feeNano : 0n;
    const amountNano = toNano(amount);
    return amountNano <= maxTransferable;
  } catch {
    return false;
  }
}
