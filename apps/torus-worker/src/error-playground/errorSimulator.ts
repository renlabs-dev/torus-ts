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
import { tryAsyncLoggingRaw } from "@torus-ts/utils/error-handler/server-operations";

// Helper to log output
function log(message: string, ...args: unknown[]): void {
  console.log(`[${new Date().toISOString()}] ${message}`, ...args);
}

// Sleep utility
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Network error simulation
async function simulateNetworkError(): Promise<void> {
  log("=== SIMULATING NETWORK ERROR ===");

  const networkErrorFn = async () => {
    log("Attempting network operation...");
    // Simulate network timeout
    await sleep(10);
    throw new Error("NETWORK ERROR: Connection timed out after 5000ms");
  };

  const [error, result] = await tryAsyncLoggingRaw(networkErrorFn());

  log("Network error simulation complete");
  log("Error object:", error);
  log("Result:", result);
  log("=============================\n");
}

// API validation error simulation
async function simulateApiError(): Promise<void> {
  log("=== SIMULATING API VALIDATION ERROR ===");

  const apiErrorFn = async () => {
    log("Attempting API call with invalid parameters...");
    await sleep(10);
    throw new Error(
      "API ERROR: Invalid parameter 'blockNumber' - expected number, got string",
    );
  };

  const [error, result] = await tryAsyncLoggingRaw(apiErrorFn());

  log("API error simulation complete");
  log("Error object:", error);
  log("Result:", result);
  log("=============================\n");
}

// Database error simulation
async function simulateDatabaseError(): Promise<void> {
  log("=== SIMULATING DATABASE ERROR ===");

  const dbErrorFn = async () => {
    log("Attempting database operation...");
    await sleep(10);
    throw new Error(
      "DATABASE ERROR: Connection to database lost. Cannot execute query.",
    );
  };

  const [error, result] = await tryAsyncLoggingRaw(dbErrorFn());

  log("Database error simulation complete");
  log("Error object:", error);
  log("Result:", result);
  log("=============================\n");
}

// Blockchain data error simulation
async function simulateBlockchainError(): Promise<void> {
  log("=== SIMULATING BLOCKCHAIN DATA ERROR ===");

  const blockchainErrorFn = async () => {
    log("Attempting to fetch blockchain data...");
    await sleep(10);
    throw new Error(
      "BLOCKCHAIN ERROR: Invalid block data - hash does not match previous block",
    );
  };

  const [error, result] = await tryAsyncLoggingRaw(blockchainErrorFn());

  log("Blockchain error simulation complete");
  log("Error object:", error);
  log("Result:", result);
  log("=============================\n");
}

// Webhook error simulation
async function simulateWebhookError(): Promise<void> {
  log("=== SIMULATING WEBHOOK ERROR ===");

  const webhookErrorFn = async () => {
    log("Attempting to send webhook notification...");
    await sleep(10);
    throw new Error(
      "WEBHOOK ERROR: Discord returned status code 429 (Too Many Requests)",
    );
  };

  const [error, result] = await tryAsyncLoggingRaw(webhookErrorFn());

  log("Webhook error simulation complete");
  log("Error object:", error);
  log("Result:", result);
  log("=============================\n");
}

// Retry mechanism simulation
async function simulateRetryMechanism(): Promise<void> {
  log("=== SIMULATING RETRY MECHANISM ===");

  let attempts = 0;

  const retryFn = async () => {
    attempts++;
    log(`Attempt ${attempts} to fetch data...`);

    // Fail first 2 attempts
    if (attempts < 3) {
      throw new Error(`Failed on attempt ${attempts}`);
    }

    return "Success after retry!";
  };

  log("Starting retry mechanism with 3 max attempts");
  let retries = 3;
  let lastError: unknown;
  let result: string | undefined;

  while (retries > 0) {
    log(`Retries remaining: ${retries}`);
    const [error, successResult] = await tryAsyncLoggingRaw<Error, string>(
      retryFn(),
    );

    if (!error) {
      result = successResult;
      log("Retry succeeded:", result);
      break;
    }

    lastError = error;
    log(
      "Attempt failed:",
      error instanceof Error ? error.message : String(error),
    );
    retries--;
    await sleep(CONSTANTS.TIME.BLOCK_TIME_MILLISECONDS / 10); // Simulated backoff
  }

  if (!result) {
    log("All retry attempts failed. Last error:", lastError);
  }

  log("Retry mechanism simulation complete");
  log("Final result:", result);
  log("=============================\n");
}

// Nesting error handlers simulation
async function simulateNestedErrorHandlers(): Promise<void> {
  log("=== SIMULATING NESTED ERROR HANDLERS ===");

  const innerFn = async () => {
    log("Executing inner function...");
    throw new Error(
      "INNER ERROR: Something went wrong inside the inner function",
    );
  };

  const middleFn = async () => {
    log("Executing middle function...");
    const [innerError, innerResult] = await tryAsyncLoggingRaw(innerFn());

    if (innerError) {
      log("Inner error detected:", innerError);
      throw new Error(
        `MIDDLE ERROR: Middle function failed due to inner error: ${innerError instanceof Error ? innerError.message : JSON.stringify(innerError)}`,
      );
    }

    return innerResult;
  };

  const outerFn = async () => {
    log("Executing outer function...");
    const [middleError, middleResult] = await tryAsyncLoggingRaw(middleFn());

    if (middleError) {
      log("Middle error detected:", middleError);
      throw new Error(
        `OUTER ERROR: Outer function failed due to middle error: ${middleError instanceof Error ? middleError.message : JSON.stringify(middleError)}`,
      );
    }

    return middleResult;
  };

  const [outerError, outerResult] = await tryAsyncLoggingRaw(outerFn());

  log("Nested error handlers simulation complete");
  log("Final error:", outerError);
  log("Final result:", outerResult);
  log("=============================\n");
}

// Run all simulations or a specific one based on command line arg
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
      log(`Unknown scenario: ${scenario}`);
      log(
        "Available scenarios: network, api, database, blockchain, webhook, retry, nested, all",
      );
  }
}

// Execute the simulations
runSimulations().catch((error) => {
  log("Unexpected error in error simulator:", error);
});
