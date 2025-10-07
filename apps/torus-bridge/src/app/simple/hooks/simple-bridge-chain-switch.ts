import { tryAsync } from "@torus-network/torus-utils/try-catch";
import {
  formatErrorForUser,
  isUserRejectionError,
  POLLING_CONFIG,
  UserRejectedError,
} from "./simple-bridge-helpers";

/**
 * Result of a chain switch operation.
 */
interface ChainSwitchResult {
  /** True if the switch was successful */
  success: boolean;
  /** Error message if switch failed */
  errorMessage?: string;
  /** User-friendly error details */
  errorDetails?: string;
  /** Whether the error was a user rejection */
  isUserRejected: boolean;
}

/**
 * Parameters for chain switch with retry logic.
 */
interface ChainSwitchParams {
  /** Target chain ID to switch to */
  targetChainId: number;
  /** Function to switch wallet to target chain */
  switchChain: (params: { chainId: number }) => Promise<{ id: number }>;
  /** Function to get current chain ID from wallet */
  getCurrentChainId: () => Promise<number>;
  /** Human-readable chain name for error messages */
  chainName: string;
}

/**
 * Attempts to switch to target chain with retry logic and verification.
 *
 * Features:
 * - Retries up to MAX_SWITCH_ATTEMPTS times
 * - Verifies switch success after each attempt
 * - Adds delay between retries
 * - Distinguishes user rejections from other errors
 *
 * @param params - Chain switch parameters
 */
export async function switchChainWithRetry(
  params: ChainSwitchParams,
): Promise<ChainSwitchResult> {
  const { targetChainId, switchChain, getCurrentChainId, chainName } = params;

  const currentChainId = await getCurrentChainId();

  // Already on target chain
  if (currentChainId === targetChainId) {
    return { success: true, isUserRejected: false };
  }

  let lastError: Error | undefined;
  let attempts = 0;

  while (attempts < POLLING_CONFIG.MAX_SWITCH_ATTEMPTS) {
    attempts++;
    console.log(
      `Attempting to switch to ${chainName} chain (attempt ${attempts})`,
    );

    const [switchError, switchResult] = await tryAsync(
      switchChain({ chainId: targetChainId }),
    );

    if (switchError !== undefined) {
      lastError = switchError;
      console.log(`Switch attempt ${attempts} failed:`, switchError.message);

      // Check if max attempts reached
      if (attempts >= POLLING_CONFIG.MAX_SWITCH_ATTEMPTS) {
        break;
      }

      // Wait before retry
      await new Promise((resolve) =>
        setTimeout(resolve, POLLING_CONFIG.SWITCH_RETRY_DELAY_MS),
      );
      continue;
    }

    // Verify switch result
    if (switchResult.id === targetChainId) {
      console.log(`Successfully switched to ${chainName} chain`);
      return { success: true, isUserRejected: false };
    }

    // Wait and verify with wallet
    await new Promise((resolve) =>
      setTimeout(resolve, POLLING_CONFIG.SWITCH_RETRY_DELAY_MS),
    );

    const verifiedChainId = await getCurrentChainId();
    if (verifiedChainId === targetChainId) {
      console.log(`Chain switch verified after delay`);
      return { success: true, isUserRejected: false };
    }

    console.warn(
      `Chain ID mismatch after switch. Expected: ${targetChainId}, Got: ${verifiedChainId}`,
    );

    // Check if max attempts reached
    if (attempts >= POLLING_CONFIG.MAX_SWITCH_ATTEMPTS) {
      lastError = new Error(
        `Chain switch verification failed. Expected ${targetChainId}, got ${verifiedChainId}`,
      );
      break;
    }

    // Wait before retry
    await new Promise((resolve) =>
      setTimeout(resolve, POLLING_CONFIG.SWITCH_RETRY_DELAY_MS),
    );
  }

  // Handle failure after all attempts
  const isUserRejected =
    lastError !== undefined && isUserRejectionError(lastError);
  const errorMessage = isUserRejected
    ? "Network switch was not accepted"
    : `Unable to switch to ${chainName} network`;

  const errorDetails = isUserRejected
    ? `Please accept the network switch in your wallet to continue the transfer, or switch manually to ${chainName} and click Retry.`
    : `Failed to switch to ${chainName} network after ${POLLING_CONFIG.MAX_SWITCH_ATTEMPTS} attempts. Please switch manually to ${chainName} in your wallet and click Retry to continue.`;

  return {
    success: false,
    errorMessage,
    errorDetails:
      lastError !== undefined ? formatErrorForUser(lastError) : errorDetails,
    isUserRejected,
  };
}

/**
 * Throws appropriate error based on chain switch result.
 *
 * @param result - Chain switch result from switchChainWithRetry
 * @throws {UserRejectedError} If user rejected the switch
 * @throws {Error} For other switch failures
 */
export function throwOnChainSwitchFailure(result: ChainSwitchResult): void {
  if (result.success) {
    return;
  }

  if (result.isUserRejected) {
    throw new UserRejectedError(result.errorMessage);
  }

  throw new Error(result.errorMessage ?? "Chain switch failed");
}
