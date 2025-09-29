export const BASE_CHAIN_ID = 8453;

export const GAS_CONFIG = {
  BASE_GAS: 21000n,
  CONTRACT_CALL_GAS: 100000n,
  get ESTIMATED_TOTAL() {
    return this.BASE_GAS + this.CONTRACT_CALL_GAS;
  },
} as const;

export const POLLING_CONFIG = {
  INTERVAL_MS: 5000,
  MAX_POLLS: 180,
  SWITCH_RETRY_DELAY_MS: 1000,
  MAX_SWITCH_ATTEMPTS: 2,
} as const;

export const CONFIRMATION_CONFIG = {
  REQUIRED_CONFIRMATIONS: 2,
} as const;

export function isUserRejectionError(error: Error): boolean {
  const errorMessage = error.message.toLowerCase();
  const errorName = error.name;

  return (
    errorMessage.includes("rejected") ||
    errorMessage.includes("denied") ||
    errorMessage.includes("cancelled") ||
    errorMessage.includes("user denied") ||
    errorMessage.includes("user rejected") ||
    errorMessage.includes("user denied transaction signature") ||
    errorMessage.includes("declined") ||
    (errorMessage.includes("signature") && errorMessage.includes("denied")) ||
    errorName === "UserRejectedRequestError" ||
    (errorName === "TransactionExecutionError" &&
      errorMessage.includes("user rejected"))
  );
}

export function getExplorerUrl(txHash: string, chainName: string): string {
  const lowerChainName = chainName.toLowerCase();

  if (lowerChainName === "base") {
    return `https://basescan.org/tx/${txHash}`;
  }

  if (lowerChainName === "torus evm" || lowerChainName === "torus") {
    return `https://blockscout.torus.network/tx/${txHash}`;
  }

  return "";
}