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
 * Polls a balance until it reaches the target (baselineBalance + expectedIncrease) or polling times out.
 *
 * Repeatedly invokes the provided `refetchBalance` and applies `extractValue` to determine the current balance.
 * Resolves when the current balance is greater than or equal to the target; otherwise returns a failure result
 * with an explanatory `errorMessage` if polling stops due to timeout or reaching the configured maximum attempts.
 *
 * @param params - Balance polling parameters including `refetchBalance`, `baselineBalance`, `expectedIncrease`, `extractValue`, and `locationName`
 * @returns `PollingResult` with `success: true` when the target is reached; otherwise `success: false` and an `errorMessage` describing the timeout or failure
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
 * Polls an EVM-style balance until it has increased by the expected amount.
 *
 * @param refetchBalance - Function that refetches the balance and returns an object with `status` and optional `data.value` as the balance
 * @param baselineBalance - The starting balance to compare against
 * @param expectedIncrease - The required increase to consider the polling successful
 * @param locationName - Human-readable identifier used in timeout/error messages
 * @returns A PollingResult with `success` true if the balance reached `baselineBalance + expectedIncrease`, `false` otherwise; `errorMessage` may be set when polling times out or fails
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