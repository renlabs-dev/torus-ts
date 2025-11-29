import { tryAsync } from "@torus-network/torus-utils/try-catch";
import {
  POLLING_CONFIG,
  TIMEOUT_CONFIG,
  withTimeout,
} from "./fast-bridge-helpers";

/**
 * Result of a balance polling operation.
 */
interface PollingResult {
  /** True if target balance was reached */
  success: boolean;
  /** Error message if polling failed or timed out */
  errorMessage?: string;
}

/**
 * Parameters for balance polling with target comparison.
 */
interface BalancePollingParams<T> {
  /** Function to refetch balance, returns status and optional balance data */
  refetchBalance: () => Promise<{ status: string; data?: T }>;
  /** Current baseline balance value */
  baselineBalance: bigint;
  /** Expected increase in balance */
  expectedIncrease: bigint;
  /** Function to extract bigint value from balance data */
  extractValue: (data: T) => bigint;
  /** Human-readable chain/location name for logging */
  locationName: string;
  /** If true, success when balance differs from baseline (for cases with unpredictable fees) */
  anyChange?: boolean;
}

/**
 * Polls balance until target is reached or timeout occurs.
 *
 * Features:
 * - Polls at configured intervals (POLLING_CONFIG.INTERVAL_MS)
 * - Stops after MAX_POLLS attempts or timeout
 * - Handles refetch errors gracefully
 * - Provides detailed logging for debugging
 * - Uses immutable abort signal pattern to stop polling
 *
 * @param params - Balance polling parameters
 */
export async function pollBalanceUntilTarget<T>(
  params: BalancePollingParams<T>,
): Promise<PollingResult> {
  const {
    refetchBalance,
    baselineBalance,
    expectedIncrease,
    extractValue,
    locationName,
    anyChange = false,
  } = params;

  const targetBalance = baselineBalance + expectedIncrease;

  let pollCount = 0;
  const abortController = new AbortController();

  const pollPromise = new Promise<PollingResult>((resolve, reject) => {
    const intervalId = setInterval(() => {
      void (async () => {
        if (abortController.signal.aborted) {
          return;
        }

        pollCount++;

        const [refetchError, refetchResult] = await tryAsync(refetchBalance());

        if (refetchError !== undefined) {
          console.warn(
            `Failed to refetch ${locationName} balance, retrying...`,
          );
          return;
        }

        if (refetchResult.status === "error") {
          return;
        }

        const currentBalance = refetchResult.data
          ? extractValue(refetchResult.data)
          : 0n;

        // Check success condition based on mode
        const isSuccess = anyChange
          ? currentBalance !== baselineBalance
          : currentBalance >= targetBalance;

        if (isSuccess) {
          clearInterval(intervalId);
          abortController.abort();
          resolve({ success: true });
          return;
        }

        if (pollCount >= POLLING_CONFIG.MAX_POLLS) {
          clearInterval(intervalId);
          abortController.abort();
          reject(
            new Error(
              `Confirmation timeout - no balance increase after ${pollCount} attempts`,
            ),
          );
        }
      })();
    }, POLLING_CONFIG.INTERVAL_MS);
  });

  const [timeoutError, result] = await tryAsync(
    withTimeout(
      pollPromise,
      TIMEOUT_CONFIG.POLLING_OPERATION_MS,
      `${locationName} balance confirmation timeout`,
    ),
  );

  abortController.abort();

  if (timeoutError !== undefined) {
    const errorMessage = timeoutError.message.includes("timeout")
      ? `${locationName} confirmation timeout - check balance and retry`
      : `${locationName} balance did not confirm (check balance and retry)`;

    return {
      success: false,
      errorMessage,
    };
  }

  return result;
}

/**
 * Specialized polling for EVM balance with value property.
 *
 * @param refetchBalance - Function to refetch balance
 * @param baselineBalance - Current baseline balance
 * @param expectedIncrease - Expected balance increase (ignored if anyChange is true)
 * @param locationName - Chain/location name for logging
 * @param anyChange - If true, succeeds when balance differs from baseline (for unpredictable fees)
 */
export async function pollEvmBalance(
  refetchBalance: () => Promise<{ status: string; data?: { value: bigint } }>,
  baselineBalance: bigint,
  expectedIncrease: bigint,
  locationName: string,
  anyChange?: boolean,
): Promise<PollingResult> {
  return pollBalanceUntilTarget({
    refetchBalance,
    baselineBalance,
    expectedIncrease,
    extractValue: (data) => data.value,
    locationName,
    anyChange,
  });
}
