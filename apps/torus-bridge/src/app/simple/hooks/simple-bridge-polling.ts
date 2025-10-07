import { tryAsync } from "@torus-network/torus-utils/try-catch";
import {
  POLLING_CONFIG,
  TIMEOUT_CONFIG,
  withTimeout,
} from "./simple-bridge-helpers";

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
  } = params;

  console.log(
    `Polling ${locationName} balance - Baseline: ${Number(baselineBalance) / 1e18} TORUS, Expected increase: ${Number(expectedIncrease) / 1e18} TORUS`,
  );

  const targetBalance = baselineBalance + expectedIncrease;
  console.log(`Target balance: ${Number(targetBalance) / 1e18} TORUS`);

  let pollCount = 0;
  const abortController = new AbortController();

  const pollPromise = new Promise<PollingResult>((resolve, reject) => {
    const intervalId = setInterval(() => {
      void (async () => {
        if (abortController.signal.aborted) {
          return;
        }

        pollCount++;
        console.log(`Poll ${pollCount}: Checking ${locationName} balance`);

        const [refetchError, refetchResult] = await tryAsync(refetchBalance());

        if (refetchError !== undefined) {
          console.warn(
            `Failed to refetch ${locationName} balance, retrying...`,
          );
          return;
        }

        if (refetchResult.status === "error") {
          console.warn(`Refetch returned error status, skipping this poll`);
          return;
        }

        const currentBalance = refetchResult.data
          ? extractValue(refetchResult.data)
          : 0n;

        console.log(`Current balance: ${Number(currentBalance) / 1e18} TORUS`);

        if (currentBalance >= targetBalance) {
          console.log(`Balance target reached! Resolving polling`);
          clearInterval(intervalId);
          abortController.abort();
          resolve({ success: true });
          return;
        }

        if (pollCount >= POLLING_CONFIG.MAX_POLLS) {
          console.log(`Polling timeout reached after ${pollCount} attempts`);
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
 */
export async function pollEvmBalance(
  refetchBalance: () => Promise<{ status: string; data?: { value: bigint } }>,
  baselineBalance: bigint,
  expectedIncrease: bigint,
  locationName: string,
): Promise<PollingResult> {
  return pollBalanceUntilTarget({
    refetchBalance,
    baselineBalance,
    expectedIncrease,
    extractValue: (data) => data.value,
    locationName,
  });
}
