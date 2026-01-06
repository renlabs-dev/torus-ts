/**
 * Swarm Verifier Service
 *
 * Polls claimable predictions via HTTP API, researches them, and submits claims.
 */

import { validateEnvOrExit } from "@torus-network/torus-utils/env";
import { BasicLogger } from "@torus-network/torus-utils/logger";
import { z } from "zod";
import { OpenRouterClient } from "./ai/openrouter-client";
import { PromptLoader } from "./ai/prompt-loader";
import { SwarmApiClient } from "./api-client";
import { getVerifierCursor, updateVerifierCursor } from "./seen-storage";
import { PredictionVerifier } from "./services/prediction-verifier";
import { withRetry } from "./utils/retry";

const logger = BasicLogger.create({ name: "swarm-verifier" });

const getEnv = validateEnvOrExit({
  SWARM_API_URL: z.string().url().default("https://api.predictionswarm.com"),
  OPENROUTER_API_KEY: z.string().min(1, "OPENROUTER_API_KEY is required"),
  AGENT_MNEMONIC: z.string().min(1, "AGENT_MNEMONIC is required"),
  VERIFICATION_MODEL: z.string().default("anthropic/claude-sonnet-4"),
  CONCURRENCY: z.coerce.number().int().positive().default(3),
  POLL_INTERVAL_MS: z.coerce.number().int().positive().default(60000),
  TOPICS: z
    .string()
    .optional()
    .transform((val) =>
      val
        ? val
            .split(",")
            .map((t) => t.trim().toLowerCase())
            .filter((t) => t.length > 0)
        : undefined,
    ),
});

async function main() {
  logger.info("Swarm Verifier Open Service starting...");

  const env = getEnv(process.env);
  logger.info("Environment validated");
  logger.info(`Verification model: ${env.VERIFICATION_MODEL}`);
  logger.info(`API URL: ${env.SWARM_API_URL}`);
  if (env.TOPICS) {
    logger.info(`Filtering topics: ${env.TOPICS.join(", ")}`);
  }

  const apiClient = await SwarmApiClient.create(
    env.SWARM_API_URL,
    env.AGENT_MNEMONIC,
  );

  const llmClient = new OpenRouterClient({
    apiKey: env.OPENROUTER_API_KEY,
    model: env.VERIFICATION_MODEL,
  });

  const promptLoader = new PromptLoader();

  const verifier = new PredictionVerifier({
    llmClient,
    promptLoader,
    apiClient,
  });

  const verifierAddress = apiClient.getAddress();
  let cursor = await getVerifierCursor(verifierAddress);

  if (cursor) {
    logger.info(`Resuming from cursor: ${cursor}`);
  }

  logger.info(`Starting verification loop with concurrency=${env.CONCURRENCY}`);

  while (true) {
    try {
      const { predictions, nextCursor, hasMore } = await withRetry(() =>
        apiClient.getClaimablePredictions(cursor, env.CONCURRENCY, env.TOPICS),
      );

      if (predictions.length === 0) {
        logger.info("No claimable predictions available, sleeping...");
        await new Promise((resolve) =>
          setTimeout(resolve, env.POLL_INTERVAL_MS),
        );
        continue;
      }

      logger.info(`Processing ${predictions.length} predictions...`);

      let batchErrors = 0;
      const verificationPromises = predictions.map((prediction) =>
        verifier.verifyPrediction(prediction).catch((error) => {
          logger.error(`Failed to verify prediction ${prediction.id}`, error);
          batchErrors++;
          return null;
        }),
      );
      const results = await Promise.all(verificationPromises);

      const claimsCount = results.filter((r) => r === "claim").length;
      const feedbackCount = results.filter((r) => r === "feedback").length;

      logger.info(
        `Batch: ${claimsCount} claims | ${feedbackCount} feedback | ${batchErrors} errors | ${predictions.length} total`,
      );
      logger.info(
        `Total: ${verifier.stats.claimsSubmitted} claims | ${verifier.stats.feedbackSubmitted} feedback | ${verifier.stats.errors} errors | ${verifier.stats.predictionsProcessed} processed`,
      );

      if (nextCursor) {
        cursor = nextCursor;
        await updateVerifierCursor(verifierAddress, cursor);
      }

      if (!hasMore) {
        logger.info("Reached end of claimable predictions, sleeping...");
        cursor = undefined;
        await new Promise((resolve) =>
          setTimeout(resolve, env.POLL_INTERVAL_MS),
        );
      }
    } catch (error) {
      logger.error("Error processing batch", error);
      await new Promise((resolve) => setTimeout(resolve, env.POLL_INTERVAL_MS));
    }
  }
}

main().catch((error) => {
  logger.error("Fatal error", error);
  process.exit(1);
});
