/**
 * Base network chain ID (mainnet).
 * @constant {number}
 */
export const BASE_CHAIN_ID = 8453;

/**
 * Gas estimation configuration for bridge operations.
 * @constant {object}
 * @property {bigint} BASE_GAS - Base gas cost for simple transfers (21,000 gas)
 * @property {bigint} CONTRACT_CALL_GAS - Additional gas for contract interactions (100,000 gas)
 * @property {bigint} ESTIMATED_TOTAL - Computed total gas estimate (BASE_GAS + CONTRACT_CALL_GAS)
 */
export const GAS_CONFIG = {
  BASE_GAS: 21000n,
  CONTRACT_CALL_GAS: 100000n,
  get ESTIMATED_TOTAL() {
    return this.BASE_GAS + this.CONTRACT_CALL_GAS;
  },
} as const;

/**
 * Polling configuration for transaction monitoring and chain switching.
 * @constant {object}
 * @property {number} INTERVAL_MS - Polling interval (5 seconds)
 * @property {number} MAX_POLLS - Maximum polling attempts (180 × 5s = 15 minutes total)
 * @property {number} SWITCH_RETRY_DELAY_MS - Delay between chain switch attempts (5 seconds)
 * @property {number} MAX_SWITCH_ATTEMPTS - Maximum chain switch retry attempts (3)
 */
export const POLLING_CONFIG = {
  INTERVAL_MS: 5000,
  MAX_POLLS: 180,
  SWITCH_RETRY_DELAY_MS: 5000, // 5 seconds between switch attempts
  MAX_SWITCH_ATTEMPTS: 3, // Try up to 3 times before failing
} as const;

/**
 * Blockchain confirmation requirements for bridge operations.
 * @constant {object}
 * @property {number} REQUIRED_CONFIRMATIONS - Minimum block confirmations required (2)
 */
export const CONFIRMATION_CONFIG = {
  REQUIRED_CONFIRMATIONS: 2,
} as const;

/**
 * Custom error class for user-rejected transactions.
 *
 * Used to distinguish between user cancellations and actual transaction errors.
 * @class UserRejectedError
 * @extends Error
 */
export class UserRejectedError extends Error {
  constructor(message = "Transaction rejected by user") {
    super(message);
    this.name = "UserRejectedError";
  }
}

/**
 * Timeout configuration for bridge operations.
 * @constant {object}
 * @property {number} DEFAULT_OPERATION_MS - Default timeout for general operations (5 minutes)
 * @property {number} POLLING_OPERATION_MS - Extended timeout for polling operations (15 minutes)
 */
export const TIMEOUT_CONFIG = {
  DEFAULT_OPERATION_MS: 300000, // 5 minutes
  POLLING_OPERATION_MS: 900000, // 15 minutes for polling operations
} as const;

/**
 * Races a Promise<T> against a timeout, rejecting with an Error if the timeout elapses first.
 *
 * Note: The underlying promise is not cancelled when timeout occurs - it continues running.
 *
 * @param promise - The Promise<T> to race against the timeout
 * @param timeoutMs - Timeout duration in milliseconds
 * @param errorMessage - Optional error message for timeout rejection (defaults to "Operation timeout")
 * @returns Promise<T> that resolves/rejects with the original promise result or rejects with Error on timeout
 * @throws Error when timeout elapses before the promise resolves
 */
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

/**
 * Detects user-rejection style errors from Error objects.
 * @param error - Error object to check for user rejection patterns
 * @returns True if the error indicates user rejection (cancelled/denied transaction), false otherwise
 */
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

/**
 * Generates a block explorer URL for a transaction hash on a given chain.
 *
 * @param txHash - Transaction hash to look up
 * @param chainName - Chain name (case-insensitive): "base", "torus evm", "torus", or "torus native"
 * @returns Explorer URL for the transaction, or empty string if chain is unsupported or has no public explorer
 */
export function getExplorerUrl(txHash: string, chainName: string): string {
  const lowerChainName = chainName.toLowerCase();

  if (lowerChainName === "base") {
    return `https://basescan.org/tx/${txHash}`;
  }

  if (lowerChainName === "torus evm" || lowerChainName === "torus") {
    return `https://blockscout.torus.network/tx/${txHash}`;
  }

  if (lowerChainName === "torus native") {
    // Torus Native (Substrate) doesn't have a public block explorer yet
    return "";
  }

  return "";
}

/**
 * Extracts the "Details:" section from a viem error message.
 * Returns the details text or null if not found.
 */
function extractViemDetails(errorMessage: string): string | null {
  const detailsRegex = /Details:\s*([^\n]+)/i;
  const detailsMatch = detailsRegex.exec(errorMessage);
  return detailsMatch?.[1]?.trim() ?? null;
}

/**
 * Extracts transaction info from viem error for context.
 * Returns a formatted string with chain, value, etc.
 */
function extractTransactionContext(errorMessage: string): string | null {
  const chainMatch = /chain:\s*([^(]+)\(id:\s*(\d+)\)/i.exec(errorMessage);
  const valueMatch = /value:\s*([\d.]+)\s*(\w+)/i.exec(errorMessage);

  if (chainMatch?.[1] && valueMatch?.[1]) {
    const chain = chainMatch[1].trim();
    const value = valueMatch[1];
    const token = valueMatch[2] ?? "TORUS";
    return `${value} ${token} on ${chain}`;
  }

  return null;
}

/**
 * Formats error messages from wallet/transaction errors into user-friendly text.
 * Extracts key details like hardware wallet issues, insufficient funds, etc.
 *
 * Handles various error formats including:
 * - Ledger/Trezor hardware wallet errors (blind signing, locked, disconnected)
 * - Insufficient funds with detailed balance info
 * - Network/connection issues
 * - viem TransactionExecutionError and InternalRpcError
 */
export function formatErrorForUser(error: Error): string {
  const errorMessage = error.message;
  const lowerMessage = errorMessage.toLowerCase();

  // Hardware wallet Blind Signing / Contract Data requirement
  if (
    lowerMessage.includes("blind signing") ||
    lowerMessage.includes("contract data")
  ) {
    return "Your hardware wallet requires Blind Signing to be enabled for this transaction.";
  }

  // Hardware wallet locked
  if (
    (lowerMessage.includes("ledger") ||
      lowerMessage.includes("trezor") ||
      lowerMessage.includes("device")) &&
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

  // Insufficient funds - detailed extraction from viem error
  if (
    lowerMessage.includes("insufficient") &&
    (lowerMessage.includes("funds") ||
      lowerMessage.includes("balance") ||
      lowerMessage.includes("eth"))
  ) {
    // Try to extract "have X want Y" from viem error
    const fundsRegex = /have\s+(\d+)\s+want\s+(\d+)/i;
    const fundsMatch = fundsRegex.exec(errorMessage);

    if (fundsMatch?.[1] && fundsMatch[2]) {
      const have = BigInt(fundsMatch[1]);
      const want = BigInt(fundsMatch[2]);
      const missing = want - have;

      // Convert wei to ETH for display (divide by 10^18)
      const haveEth = Number(have) / 1e18;
      const wantEth = Number(want) / 1e18;
      const missingEth = Number(missing) / 1e18;

      return `Insufficient funds.\n\nYou have: ${haveEth.toFixed(6)} ETH\nRequired: ${wantEth.toFixed(6)} ETH\nMissing: ${missingEth.toFixed(6)} ETH\n\nPlease add funds to your wallet.`;
    }

    // Fallback to generic messages
    if (lowerMessage.includes("gas") || lowerMessage.includes("eth")) {
      return "Insufficient ETH for gas fees. Please add ETH to your wallet and try again.";
    }
    return "Insufficient funds. Please check your balance and try with a smaller amount.";
  }

  // Gas/fee issues
  if (
    lowerMessage.includes("gas") ||
    lowerMessage.includes("fee") ||
    lowerMessage.includes("out of gas")
  ) {
    return "Insufficient ETH for gas fees. Please add ETH to your Torus EVM wallet and try again.";
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

  // Internal error with Details - common viem format
  if (lowerMessage.includes("internal error")) {
    const details = extractViemDetails(errorMessage);
    if (details) {
      const context = extractTransactionContext(errorMessage);
      if (context) {
        return `${details}\n\nTransaction: ${context}`;
      }
      return details;
    }
  }

  // Generic transaction execution error - try to extract useful info
  if (lowerMessage.includes("transactionexecutionerror")) {
    const details = extractViemDetails(errorMessage);
    if (details) {
      return `Transaction failed: ${details}`;
    }
  }

  // Internal RPC error - extract details if available
  if (lowerMessage.includes("internalrpcerror")) {
    const details = extractViemDetails(errorMessage);
    if (details) {
      return details;
    }
  }

  // Fallback: return first meaningful line if error is too long
  if (errorMessage.length > 200) {
    // First try to extract Details section
    const details = extractViemDetails(errorMessage);
    if (details) {
      return details;
    }

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
