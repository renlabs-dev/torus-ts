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
import { BasicLogger } from "@torus-network/torus-utils/logger";
import { tryAsync } from "@torus-network/torus-utils/try-catch";

const log = BasicLogger.create({ name: "error-playground" });

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
    log.info(`${label}: Attempt ${maxRetries - retries + 1}/${maxRetries}`);

    const [error, result] = await tryAsync<T>(operation());

    if (!error) {
      log.info(`${label}: Success after ${maxRetries - retries + 1} attempts`);
      return result;
    }

    lastError = error;
    log.error(
      `${label}: Failed - ${error instanceof Error ? error.message : JSON.stringify(error)}`,
    );
    retries--;

    if (retries > 0) {
      const delay = CONSTANTS.TIME.BLOCK_TIME_MILLISECONDS / 10;
      log.warn(`${label}: Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  log.error(`${label}: All ${maxRetries} attempts failed`);
  throw lastError;
}

// Agent Fetcher Worker error simulations
async function simulateAgentFetcherErrors(scenario: string): Promise<void> {
  log.info("=== SIMULATING AGENT FETCHER WORKER ERRORS ===");

  switch (scenario.toLowerCase()) {
    case "fetch":
      // Simulate whitelist/agents fetch errors
      log.info("Simulating whitelist query error");
      tryAsync(
        (async () => {
          throw new Error("Failed to query whitelist: Node is not synced");
        })(),
      );

      log.info("Simulating agents query error");
      tryAsync(
        (async () => {
          throw new Error("Failed to query agents: Node connection dropped");
        })(),
      );
      break;

    case "process":
      // Simulate processing errors
      log.info("Simulating agent data processing error");
      tryAsync(
        (async () => {
          throw new Error(
            "Failed to process agent data: Invalid agent structure",
          );
        })(),
      );
      break;

    case "database":
      // Simulate database errors
      log.info("Simulating agent data upsert error");
      tryAsync(
        (async () => {
          throw new Error(
            "Failed to upsert agent data: Database connection failed",
          );
        })(),
      );

      log.info("Simulating application upsert error");
      tryAsync(
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
      log.warn(`Unknown scenario for agent-fetcher: ${scenario}`);
      log.warn("Available scenarios: fetch, process, database, all");
  }

  log.info("=== AGENT FETCHER ERROR SIMULATION COMPLETE ===\n");
}

// DAO Applications Notifier error simulations
async function simulateDaoApplicationsErrors(scenario: string): Promise<void> {
  log.info("=== SIMULATING DAO APPLICATIONS NOTIFIER ERRORS ===");

  switch (scenario.toLowerCase()) {
    case "fetch":
      // Simulate fetch errors
      log.info("Simulating applications query error");
      tryAsync(
        (async () => {
          throw new Error("Failed to query applications: Database timeout");
        })(),
      );
      break;

    case "process":
      // Simulate processing errors
      log.info("Simulating application metadata processing error");
      tryAsync(
        (async () => {
          throw new Error(
            "Failed to process metadata: Invalid IPFS URI format",
          );
        })(),
      );
      break;

    case "notification":
      // Simulate webhook errors
      log.info("Simulating Discord webhook error");
      tryAsync(
        (async () => {
          throw new Error(
            "Failed to send Discord webhook: Rate limit exceeded",
          );
        })(),
      );
      break;

    case "database":
      // Simulate database errors
      log.info("Simulating notification toggle error");
      tryAsync(
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
      log.info(`Unknown scenario for dao-applications: ${scenario}`);
      log.info(
        "Available scenarios: fetch, process, notification, database, all",
      );
  }

  log.info("=== DAO APPLICATIONS NOTIFIER ERROR SIMULATION COMPLETE ===\n");
}

// Process DAO Applications Worker error simulations
async function simulateProcessDaoErrors(scenario: string): Promise<void> {
  log.info("=== SIMULATING PROCESS DAO APPLICATIONS WORKER ERRORS ===");

  switch (scenario.toLowerCase()) {
    case "fetch":
      // Simulate fetch errors
      log.info("Simulating votes query error");
      tryAsync(
        (async () => {
          throw new Error("Failed to query votes: Database connection lost");
        })(),
      );
      break;

    case "process":
      // Simulate vote processing errors
      log.info("Simulating vote processing error");
      tryAsync(
        (async () => {
          throw new Error("Failed to process votes: Invalid vote structure");
        })(),
      );

      // Simulate a retry scenario
      log.info("Simulating vote processing with retry");
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
        log.info("All vote processing retries failed:", error);
      }
      break;

    case "database":
      // Simulate database errors
      log.info("Simulating vote update error");
      tryAsync(
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
      log.info(`Unknown scenario for process-dao: ${scenario}`);
      log.info("Available scenarios: fetch, process, database, all");
  }

  log.info(
    "=== PROCESS DAO APPLICATIONS WORKER ERROR SIMULATION COMPLETE ===\n",
  );
}

// Weight Aggregator Worker error simulations
async function simulateWeightAggregatorErrors(scenario: string): Promise<void> {
  log.info("=== SIMULATING WEIGHT AGGREGATOR WORKER ERRORS ===");

  switch (scenario.toLowerCase()) {
    case "fetch":
      // Simulate fetch errors
      log.info("Simulating last block query error");
      await tryAsync(
        (async () => {
          throw new Error("Failed to query last block: Node connection error");
        })(),
      );

      log.info("Simulating stakes query error");
      await tryAsync(
        (async () => {
          throw new Error("Failed to query stakes: Invalid validator key");
        })(),
      );
      break;

    case "process":
      // Simulate weight calculation errors
      log.info("Simulating weight calculation error");
      await tryAsync(
        (async () => {
          throw new Error("Failed to calculate weights: Division by zero");
        })(),
      );
      break;

    case "database":
      // Simulate database errors
      log.info("Simulating weight upsert error");
      await tryAsync(
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
      log.info(`Unknown scenario for weight-aggregator: ${scenario}`);
      log.info("Available scenarios: fetch, process, database, all");
  }

  log.info("=== WEIGHT AGGREGATOR WORKER ERROR SIMULATION COMPLETE ===\n");
}

// Run simulations based on command line args
async function runWorkerSimulations(): Promise<void> {
  const worker = process.argv[2] ?? "all";
  const scenario = process.argv[3] ?? "all";

  log.info(
    `Starting error playground for worker: ${worker}, scenario: ${scenario}`,
  );

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
      log.info(`Unknown worker: ${worker}`);
      log.info(
        "Available workers: agent-fetcher, dao-applications, process-dao, weight-aggregator, all",
      );
  }

  log.info("Error simulation playground complete");
}

// Execute the simulations
runWorkerSimulations().catch((error) => {
  log.info("Unexpected error in worker error playground:", error);
});
