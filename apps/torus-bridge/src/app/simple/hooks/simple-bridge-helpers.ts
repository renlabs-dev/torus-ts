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

/**
 * Custom error for user-rejected transactions
 * Used to distinguish between user cancellations and actual errors
 */
export class UserRejectedError extends Error {
  constructor(message = "Transaction rejected by user") {
    super(message);
    this.name = "UserRejectedError";
  }
}

export const TIMEOUT_CONFIG = {
  DEFAULT_OPERATION_MS: 300000, // 5 minutes
  POLLING_OPERATION_MS: 900000, // 15 minutes for polling operations
} as const;

export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = "Operation timeout",
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs),
    ),
  ]);
}

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

/**
 * Formats error messages from wallet/transaction errors into user-friendly text.
 * Extracts key details like hardware wallet issues, insufficient funds, etc.
 */
export function formatErrorForUser(error: Error): string {
  const errorMessage = error.message;
  const lowerMessage = errorMessage.toLowerCase();

  // Hardware wallet locked
  if (
    (lowerMessage.includes("ledger") || lowerMessage.includes("trezor") || lowerMessage.includes("device")) &&
    (lowerMessage.includes("locked") || lowerMessage.includes("unlock"))
  ) {
    return "Your hardware wallet is locked. Please unlock it and try again.";
  }

  // Device disconnected
  if (
    lowerMessage.includes("device") &&
    (lowerMessage.includes("disconnected") ||
      lowerMessage.includes("not found"))
  ) {
    return "Hardware wallet disconnected. Please reconnect your device and try again.";
  }

  // Insufficient funds
  if (
    lowerMessage.includes("insufficient") &&
    (lowerMessage.includes("funds") || lowerMessage.includes("balance"))
  ) {
    return "Insufficient funds. Please check your balance and try with a smaller amount.";
  }

  // Gas/fee issues
  if (
    lowerMessage.includes("gas") ||
    lowerMessage.includes("fee") ||
    lowerMessage.includes("out of gas")
  ) {
    return "Gas fee issue. Please ensure you have enough ETH for gas fees.";
  }

  // Network issues
  if (
    lowerMessage.includes("network") ||
    lowerMessage.includes("connection") ||
    lowerMessage.includes("timeout")
  ) {
    return "Network connection issue. Please check your internet connection and try again.";
  }

  // User rejection (should be handled separately, but just in case)
  if (isUserRejectionError(error)) {
    return "Transaction was rejected. Please try again when ready.";
  }

  // Generic transaction execution error - try to extract useful info
  if (lowerMessage.includes("transactionexecutionerror")) {
    // Look for "Details:" section
    const detailsRegex = /Details:\s*([^\n]+)/i;
    const detailsMatch = detailsRegex.exec(errorMessage);
    if (detailsMatch?.[1]) {
      return `Transaction failed: ${detailsMatch[1].trim()}`;
    }
  }

  // Internal RPC error - extract details if available
  if (lowerMessage.includes("internalrpcerror")) {
    const detailsRegex = /Details:\s*([^\n]+)/i;
    const detailsMatch = detailsRegex.exec(errorMessage);
    if (detailsMatch?.[1]) {
      return detailsMatch[1].trim();
    }
  }

  // Fallback: return first meaningful line if error is too long
  if (errorMessage.length > 200) {
    const lines = errorMessage.split("\n");
    const firstMeaningfulLine = lines.find(
      (line) => line.trim() && !line.includes("at ") && !line.includes("("),
    );
    if (firstMeaningfulLine) {
      return firstMeaningfulLine.trim();
    }
    return "Transaction failed. Please try again or contact support.";
  }

  // Return the error message as-is if it's short enough
  return errorMessage;
}
