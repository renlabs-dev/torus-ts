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
  return toNano(amount) >= minStake;
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
  const stake = toNano(amount);
  const feeNano = toNano(fee);
  return freeBalance - stake - feeNano >= existentialDeposit;
}

/**
 * Ensure the amount does not exceed the maximum allowed based on the free balance, fee, and existential deposit.
 */
export function doesNotExceedMaxStake(
  amount: string,
  fee: string,
  freeBalance: bigint,
  existentialDeposit: bigint
): boolean {
  const stake = toNano(amount);
  const feeNano = toNano(fee);
  const maxStake = freeBalance - feeNano - existentialDeposit;
  return stake <= maxStake;
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
