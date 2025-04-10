/* eslint-disable @typescript-eslint/require-await */
/**
 * Error Playground for torus-worker
 *
 * This file lets you simulate various error scenarios that might occur in the worker
 * to see how they are handled and what the error output looks like.
 *
 * Usage:
 * Run with: `pnpm exec tsx src/error-playground/errorSimulator.ts [scenario]`
 * 
 * Example Usage:
 * pnpm exec tsx src/error-playground/errorSimulator.ts network

 *
 * Available scenarios:
 * - network: Simulates network errors like timeouts and connection issues
 * - api: Simulates API validation errors
 * - database: Simulates database errors
 * - blockchain: Simulates blockchain data errors
 * - webhook: Simulates webhook delivery errors
 * - retry: Demonstrates retry mechanism working successfully
 * - all: Run all scenarios
 */

import { CONSTANTS } from "@torus-network/sdk";
import { tryAsync } from "@torus-ts/utils/try-catch";
import { createLogger } from "../common/log";

const log = createLogger({ name: "error-simulator" });

/**
 * Creates a promise that resolves after the specified duration
 *
 * @param ms - The time to sleep in milliseconds
 * @returns A promise that resolves after the specified delay
 */
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Simulates a network error scenario with proper error handling
 *
 * Demonstrates how to capture and log network-related errors such as
 * connection timeouts and network failures
 */
async function simulateNetworkError(): Promise<void> {
  log.info("=== SIMULATING NETWORK ERROR ===");

  const networkErrorFn = async () => {
    log.info("Attempting network operation...");
    // Simulate network timeout
    await sleep(10);
    throw new Error("NETWORK ERROR: Connection timed out after 5000ms");
  };

  const [error, result] = await tryAsync(networkErrorFn());

  log.info("Network error simulation complete");
  log.info("Error:", error !== undefined ? error.message : "None");
  log.info("Result:", result);
  log.info("=============================\n");
}

/**
 * Simulates an API validation error scenario with proper error handling
 *
 * Demonstrates how to capture and log API-related errors such as
 * invalid parameters and malformed requests
 */
async function simulateApiError(): Promise<void> {
  log.info("=== SIMULATING API VALIDATION ERROR ===");

  const apiErrorFn = async () => {
    log.info("Attempting API call with invalid parameters...");
    await sleep(10);
    throw new Error(
      "API ERROR: Invalid parameter 'blockNumber' - expected number, got string",
    );
  };

  const [error, result] = await tryAsync(apiErrorFn());

  log.info("API error simulation complete");
  log.info("Error:", error !== undefined ? error.message : "None");
  log.info("Result:", result);
  log.info("=============================\n");
}

/**
 * Simulates a database error scenario with proper error handling
 *
 * Demonstrates how to capture and log database-related errors such as
 * connection failures and query execution errors
 */
async function simulateDatabaseError(): Promise<void> {
  log.info("=== SIMULATING DATABASE ERROR ===");

  const dbErrorFn = async () => {
    log.info("Attempting database operation...");
    await sleep(10);
    throw new Error(
      "DATABASE ERROR: Connection to database lost. Cannot execute query.",
    );
  };

  const [error, result] = await tryAsync(dbErrorFn());

  log.info("Database error simulation complete");
  log.info("Error:", error !== undefined ? error.message : "None");
  log.info("Result:", result);
  log.info("=============================\n");
}

/**
 * Simulates a blockchain data error scenario with proper error handling
 *
 * Demonstrates how to capture and log blockchain-related errors such as
 * invalid block data and chain inconsistencies
 */
async function simulateBlockchainError(): Promise<void> {
  log.info("=== SIMULATING BLOCKCHAIN DATA ERROR ===");

  const blockchainErrorFn = async () => {
    log.info("Attempting to fetch blockchain data...");
    await sleep(10);
    throw new Error(
      "BLOCKCHAIN ERROR: Invalid block data - hash does not match previous block",
    );
  };

  const [error, result] = await tryAsync(blockchainErrorFn());

  log.info("Blockchain error simulation complete");
  log.info("Error:", error !== undefined ? error.message : "None");
  log.info("Result:", result);
  log.info("=============================\n");
}

/**
 * Simulates a webhook error scenario with proper error handling
 *
 * Demonstrates how to capture and log webhook-related errors such as
 * rate limiting and service unavailability
 */
async function simulateWebhookError(): Promise<void> {
  log.info("=== SIMULATING WEBHOOK ERROR ===");

  const webhookErrorFn = async () => {
    log.info("Attempting to send webhook notification...");
    await sleep(10);
    throw new Error(
      "WEBHOOK ERROR: Discord returned status code 429 (Too Many Requests)",
    );
  };

  const [error, result] = await tryAsync(webhookErrorFn());

  log.info("Webhook error simulation complete");
  log.info("Error:", error !== undefined ? error.message : "None");
  log.info("Result:", result);
  log.info("=============================\n");
}

/**
 * Simulates a retry mechanism with proper error handling
 *
 * Demonstrates how to implement retry logic for operations that may fail
 * temporarily but succeed on subsequent attempts
 */
async function simulateRetryMechanism(): Promise<void> {
  log.info("=== SIMULATING RETRY MECHANISM ===");

  let attempts = 0;

  const retryFn = async () => {
    attempts++;
    log.info(`Attempt ${attempts} to fetch data...`);

    // Fail first 2 attempts
    if (attempts < 3) {
      throw new Error(`Failed on attempt ${attempts}`);
    }

    return "Success after retry!";
  };

  log.info("Starting retry mechanism with 3 max attempts");
  let retries = 3;
  let lastError: Error | undefined;
  let result: string | undefined;

  while (retries > 0) {
    log.info(`Retries remaining: ${retries}`);
    const [error, successResult] = await tryAsync<string>(retryFn());

    if (error === undefined) {
      result = successResult;
      log.info("Retry succeeded:", result);
      break;
    }

    lastError = error;
    log.error(error);
    retries--;
    await sleep(CONSTANTS.TIME.BLOCK_TIME_MILLISECONDS / 10); // Simulated backoff
  }

  if (result === undefined && lastError !== undefined) {
    log.error("All retry attempts failed:", lastError);
  }

  log.info("Retry mechanism simulation complete");
  log.info("Final result:", result);
  log.info("=============================\n");
}

/**
 * Simulates nested error handlers with proper error propagation
 *
 * Demonstrates how errors can be caught, processed, and re-thrown
 * through multiple layers of function calls
 */
async function simulateNestedErrorHandlers(): Promise<void> {
  log.info("=== SIMULATING NESTED ERROR HANDLERS ===");

  const innerFn = async () => {
    log.info("Executing inner function...");
    throw new Error(
      "INNER ERROR: Something went wrong inside the inner function",
    );
  };

  const middleFn = async () => {
    log.info("Executing middle function...");
    const [innerError, innerResult] = await tryAsync(innerFn());

    if (innerError !== undefined) {
      log.error("Inner error detected:", innerError);
      throw new Error(
        `MIDDLE ERROR: Middle function failed due to inner error: ${innerError.message}`,
      );
    }

    return innerResult;
  };

  const outerFn = async () => {
    log.info("Executing outer function...");
    const [middleError, middleResult] = await tryAsync(middleFn());

    if (middleError !== undefined) {
      log.error("Middle error detected:", middleError);
      throw new Error(
        `OUTER ERROR: Outer function failed due to middle error: ${middleError.message}`,
      );
    }

    return middleResult;
  };

  const [outerError, outerResult] = await tryAsync(outerFn());

  log.info("Nested error handlers simulation complete");
  log.info(
    "Final error:",
    outerError !== undefined ? outerError.message : "None",
  );
  log.info("Final result:", outerResult);
  log.info("=============================\n");
}

/**
 * Runs simulation scenarios based on command line arguments
 *
 * @returns A promise that resolves when all simulations are complete
 */
async function runSimulations(): Promise<void> {
  const scenario = process.argv[2] ?? "all";

  switch (scenario.toLowerCase()) {
    case "network":
      await simulateNetworkError();
      break;
    case "api":
      await simulateApiError();
      break;
    case "database":
      await simulateDatabaseError();
      break;
    case "blockchain":
      await simulateBlockchainError();
      break;
    case "webhook":
      await simulateWebhookError();
      break;
    case "retry":
      await simulateRetryMechanism();
      break;
    case "nested":
      await simulateNestedErrorHandlers();
      break;
    case "all":
      await simulateNetworkError();
      await simulateApiError();
      await simulateDatabaseError();
      await simulateBlockchainError();
      await simulateWebhookError();
      await simulateRetryMechanism();
      await simulateNestedErrorHandlers();
      break;
    default:
      log.warn(`Unknown scenario: ${scenario}`);
      log.info(
        "Available scenarios: network, api, database, blockchain, webhook, retry, nested, all",
      );
  }
}
// Execute the simulations
await runSimulations();
