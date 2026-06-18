export const WITHDRAW_GAS_BUFFER = 100_000_000_000_000_000n; // 0.1 TORUS
export const MIN_NATIVE_WITHDRAW_AMOUNT = 500_000_000_000_000_000n; // 0.5 TORUS

export function getNativeWithdrawAmount(evmBalance: bigint): bigint {
  if (evmBalance <= WITHDRAW_GAS_BUFFER) return 0n;
  return evmBalance - WITHDRAW_GAS_BUFFER;
}

export function shouldOfferNativeWithdrawal(evmBalance: bigint): boolean {
  return getNativeWithdrawAmount(evmBalance) > MIN_NATIVE_WITHDRAW_AMOUNT;
}
