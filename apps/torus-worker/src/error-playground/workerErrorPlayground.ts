/* eslint-disable @typescript-eslint/require-await */
/**
 * Worker-specific Error Playground
 *
 * This playground allows you to simulate errors in specific worker components
 * to see how they're handled with the new error handling system.
 *
 * Usage:
 * Run with: `pnpm exec tsx src/error-playground/ErrorPlayground.ts [worker] [scenario]`
 *
 * Example Usage:
 * pnpm exec tsx src/error-playground/workerErrorPlayground.ts agent-fetcher fetch
 *
 * Available workers:
 * - agent-fetcher: Agent fetcher worker errors
 * - dao-applications: DAO applications worker errors
 * - process-dao: Process DAO applications worker errors
 * - weight-aggregator: Weight aggregator worker errors
 *
 * Available scenarios:
 * - fetch: Data fetching errors
 * - process: Data processing errors
 * - database: Database operation errors
 * - notification: Notification errors (for dao-applications)
 * - all: Run all scenarios for the selected worker
 */

import { CONSTANTS } from "@torus-network/sdk";
import { tryAsyncLoggingRaw } from "@torus-ts/utils/error-helpers/server-operations";

// Helper to log output
function log(message: string, ...args: unknown[]): void {
  console.log(`[${new Date().toISOString()}] ${message}`, ...args);
}

// Sleep utility
async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Simulates retry logic like in the workers
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  label = "Operation",
): Promise<T> {
  let retries = maxRetries;
  let lastError: unknown;

  while (retries > 0) {
    log(`${label}: Attempt ${maxRetries - retries + 1}/${maxRetries}`);

    const [error, result] = await tryAsyncLoggingRaw<T>(operation());

    if (!error) {
      log(`${label}: Success after ${maxRetries - retries + 1} attempts`);
      return result;
    }

    lastError = error;
    log(
      `${label}: Failed - ${error instanceof Error ? error.message : JSON.stringify(error)}`,
    );
    retries--;

    if (retries > 0) {
      const delay = CONSTANTS.TIME.BLOCK_TIME_MILLISECONDS / 10;
      log(`${label}: Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  log(`${label}: All ${maxRetries} attempts failed`);
  throw lastError;
}

// Agent Fetcher Worker error simulations
async function simulateAgentFetcherErrors(scenario: string): Promise<void> {
  log("=== SIMULATING AGENT FETCHER WORKER ERRORS ===");

  switch (scenario.toLowerCase()) {
    case "fetch":
      // Simulate whitelist/agents fetch errors
      log("Simulating whitelist query error");
      await tryAsyncLoggingRaw(
        (async () => {
          throw new Error("Failed to query whitelist: Node is not synced");
        })(),
      );

      log("Simulating agents query error");
      await tryAsyncLoggingRaw(
        (async () => {
          throw new Error("Failed to query agents: Node connection dropped");
        })(),
      );
      break;

    case "process":
      // Simulate processing errors
      log("Simulating agent data processing error");
      await tryAsyncLoggingRaw(
        (async () => {
          throw new Error(
            "Failed to process agent data: Invalid agent structure",
          );
        })(),
      );
      break;

    case "database":
      // Simulate database errors
      log("Simulating agent data upsert error");
      await tryAsyncLoggingRaw(
        (async () => {
          throw new Error(
            "Failed to upsert agent data: Database connection failed",
          );
        })(),
      );

      log("Simulating application upsert error");
      await tryAsyncLoggingRaw(
        (async () => {
          throw new Error(
            "Failed to upsert application: Unique constraint violation",
          );
        })(),
      );
      break;

    case "all":
      await simulateAgentFetcherErrors("fetch");
      await simulateAgentFetcherErrors("process");
      await simulateAgentFetcherErrors("database");
      break;

    default:
      log(`Unknown scenario for agent-fetcher: ${scenario}`);
      log("Available scenarios: fetch, process, database, all");
  }

  log("=== AGENT FETCHER ERROR SIMULATION COMPLETE ===\n");
}

// DAO Applications Notifier error simulations
async function simulateDaoApplicationsErrors(scenario: string): Promise<void> {
  log("=== SIMULATING DAO APPLICATIONS NOTIFIER ERRORS ===");

  switch (scenario.toLowerCase()) {
    case "fetch":
      // Simulate fetch errors
      log("Simulating applications query error");
      await tryAsyncLoggingRaw(
        (async () => {
          throw new Error("Failed to query applications: Database timeout");
        })(),
      );
      break;

    case "process":
      // Simulate processing errors
      log("Simulating application metadata processing error");
      await tryAsyncLoggingRaw(
        (async () => {
          throw new Error(
            "Failed to process metadata: Invalid IPFS URI format",
          );
        })(),
      );
      break;

    case "notification":
      // Simulate webhook errors
      log("Simulating Discord webhook error");
      await tryAsyncLoggingRaw(
        (async () => {
          throw new Error(
            "Failed to send Discord webhook: Rate limit exceeded",
          );
        })(),
      );
      break;

    case "database":
      // Simulate database errors
      log("Simulating notification toggle error");
      await tryAsyncLoggingRaw(
        (async () => {
          throw new Error(
            "Failed to toggle notification status: Transaction failed",
          );
        })(),
      );
      break;

    case "all":
      await simulateDaoApplicationsErrors("fetch");
      await simulateDaoApplicationsErrors("process");
      await simulateDaoApplicationsErrors("notification");
      await simulateDaoApplicationsErrors("database");
      break;

    default:
      log(`Unknown scenario for dao-applications: ${scenario}`);
      log("Available scenarios: fetch, process, notification, database, all");
  }

  log("=== DAO APPLICATIONS NOTIFIER ERROR SIMULATION COMPLETE ===\n");
}

// Process DAO Applications Worker error simulations
async function simulateProcessDaoErrors(scenario: string): Promise<void> {
  log("=== SIMULATING PROCESS DAO APPLICATIONS WORKER ERRORS ===");

  switch (scenario.toLowerCase()) {
    case "fetch":
      // Simulate fetch errors
      log("Simulating votes query error");
      await tryAsyncLoggingRaw(
        (async () => {
          throw new Error("Failed to query votes: Database connection lost");
        })(),
      );
      break;

    case "process":
      // Simulate vote processing errors
      log("Simulating vote processing error");
      await tryAsyncLoggingRaw(
        (async () => {
          throw new Error("Failed to process votes: Invalid vote structure");
        })(),
      );

      // Simulate a retry scenario
      log("Simulating vote processing with retry");
      try {
        await withRetry(
          () => {
            // This will succeed on the 3rd attempt
            const attempt = Math.random();
            if (attempt < 0.7) {
              throw new Error(
                `Random vote processing failure (${attempt.toFixed(2)})`,
              );
            }
            return Promise.resolve("Vote processing succeeded");
          },
          3,
          "Vote Processing",
        );
      } catch (error) {
        log("All vote processing retries failed:", error);
      }
      break;

    case "database":
      // Simulate database errors
      log("Simulating vote update error");
      await tryAsyncLoggingRaw(
        (async () => {
          throw new Error(
            "Failed to update vote: Database constraint violation",
          );
        })(),
      );
      break;

    case "all":
      await simulateProcessDaoErrors("fetch");
      await simulateProcessDaoErrors("process");
      await simulateProcessDaoErrors("database");
      break;

    default:
      log(`Unknown scenario for process-dao: ${scenario}`);
      log("Available scenarios: fetch, process, database, all");
  }

  log("=== PROCESS DAO APPLICATIONS WORKER ERROR SIMULATION COMPLETE ===\n");
}

// Weight Aggregator Worker error simulations
async function simulateWeightAggregatorErrors(scenario: string): Promise<void> {
  log("=== SIMULATING WEIGHT AGGREGATOR WORKER ERRORS ===");

  switch (scenario.toLowerCase()) {
    case "fetch":
      // Simulate fetch errors
      log("Simulating last block query error");
      await tryAsyncLoggingRaw(
        (async () => {
          throw new Error("Failed to query last block: Node connection error");
        })(),
      );

      log("Simulating stakes query error");
      await tryAsyncLoggingRaw(
        (async () => {
          throw new Error("Failed to query stakes: Invalid validator key");
        })(),
      );
      break;

    case "process":
      // Simulate weight calculation errors
      log("Simulating weight calculation error");
      await tryAsyncLoggingRaw(
        (async () => {
          throw new Error("Failed to calculate weights: Division by zero");
        })(),
      );
      break;

    case "database":
      // Simulate database errors
      log("Simulating weight upsert error");
      await tryAsyncLoggingRaw(
        (async () => {
          throw new Error("Failed to upsert weights: Database timeout");
        })(),
      );
      break;

    case "all":
      await simulateWeightAggregatorErrors("fetch");
      await simulateWeightAggregatorErrors("process");
      await simulateWeightAggregatorErrors("database");
      break;

    default:
      log(`Unknown scenario for weight-aggregator: ${scenario}`);
      log("Available scenarios: fetch, process, database, all");
  }

  log("=== WEIGHT AGGREGATOR WORKER ERROR SIMULATION COMPLETE ===\n");
}

// Run simulations based on command line args
async function runWorkerSimulations(): Promise<void> {
  const worker = process.argv[2] ?? "all";
  const scenario = process.argv[3] ?? "all";

  log(`Starting error playground for worker: ${worker}, scenario: ${scenario}`);

  switch (worker.toLowerCase()) {
    case "agent-fetcher":
      await simulateAgentFetcherErrors(scenario);
      break;
    case "dao-applications":
      await simulateDaoApplicationsErrors(scenario);
      break;
    case "process-dao":
      await simulateProcessDaoErrors(scenario);
      break;
    case "weight-aggregator":
      await simulateWeightAggregatorErrors(scenario);
      break;
    case "all":
      await simulateAgentFetcherErrors(scenario);
      await simulateDaoApplicationsErrors(scenario);
      await simulateProcessDaoErrors(scenario);
      await simulateWeightAggregatorErrors(scenario);
      break;
    default:
      log(`Unknown worker: ${worker}`);
      log(
        "Available workers: agent-fetcher, dao-applications, process-dao, weight-aggregator, all",
      );
  }

  log("Error simulation playground complete");
}

// Execute the simulations
runWorkerSimulations().catch((error) => {
  log("Unexpected error in worker error playground:", error);
});
