/**
 * Swarm Filter Service
 *
 * This service processes scraped tweets and filters them for predictions using LLMs.
 */

import { Keyring } from "@polkadot/api";
import { hexToU8a, u8aToHex } from "@polkadot/util";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { validateEnvOrExit } from "@torus-network/torus-utils/env";
import { BasicLogger } from "@torus-network/torus-utils/logger";
import { z } from "zod";
import { OpenRouterClient } from "./ai/openrouter-client";
import { PromptLoader } from "./ai/prompt-loader";
import { getFilterCursor, updateFilterCursor } from "./cursor-storage";
import { ElysiaAPIClient } from "./elysia-api-client";
import { PredictionExtractor } from "./services/prediction-extractor";
import { withRetry } from "./utils/retry";

const logger = BasicLogger.create({ name: "swarm-filter" });

/**
 * Validate and get environment variables
 */
const getEnv = validateEnvOrExit({
  OPENROUTER_API_KEY: z.string().min(1, "OPENROUTER_API_KEY is required"),
  PREDICTION_CHECK_MODEL: z
    .string()
    .default("meta-llama/llama-3.2-1b-instruct"),
  TOPIC_CLASSIFICATION_MODEL: z.string().default("google/gemini-2.5-flash"),
  PREDICTION_EXTRACTION_MODEL: z
    .string()
    .default("anthropic/claude-sonnet-4.5"),
  FILTER_AGENT_MNEMONIC: z.string().min(1, "FILTER_AGENT_MNEMONIC is required"),
  API_URL: z.string().url().default("https://api.predictionswarm.com"),
  BATCH_SIZE: z.coerce.number().int().positive().default(24),
  POLL_INTERVAL_MS: z.coerce.number().int().positive().default(60000), // 1 minute
});

/**
 * Main service loop
 */
async function main() {
  logger.info("Swarm Filter Service starting...");

  const env = getEnv(process.env);
  logger.info("Environment validated");
  logger.info(`Prediction check model: ${env.PREDICTION_CHECK_MODEL}`);
  logger.info(`Topic classification model: ${env.TOPIC_CLASSIFICATION_MODEL}`);
  logger.info(`Extraction model: ${env.PREDICTION_EXTRACTION_MODEL}`);

  await cryptoWaitReady();
  const keyring = new Keyring({ type: "sr25519" });
  const keypair = keyring.addFromUri(env.FILTER_AGENT_MNEMONIC);

  const signHash = async (hash: string): Promise<string> => {
    const hashBytes = hexToU8a(hash);
    const signature = keypair.sign(hashBytes);
    return u8aToHex(signature);
  };

  const api = await ElysiaAPIClient.create(
    env.API_URL,
    env.FILTER_AGENT_MNEMONIC,
  );

  const predictionCheckClient = new OpenRouterClient({
    apiKey: env.OPENROUTER_API_KEY,
    model: env.PREDICTION_CHECK_MODEL,
  });

  const topicClassificationClient = new OpenRouterClient({
    apiKey: env.OPENROUTER_API_KEY,
    model: env.TOPIC_CLASSIFICATION_MODEL,
  });

  const extractionClient = new OpenRouterClient({
    apiKey: env.OPENROUTER_API_KEY,
    model: env.PREDICTION_EXTRACTION_MODEL,
  });

  const promptLoader = new PromptLoader();

  const extractor = new PredictionExtractor({
    predictionCheckClient,
    topicClassificationClient,
    extractionClient,
    promptLoader,
    signHash,
    signerAddress: keypair.address,
  });

  const { cursor: initialCursor } = await withRetry(() => getFilterCursor());
  let cursor = initialCursor;
  logger.info(`Starting from cursor: ${cursor}`);

  // Track stats
  let totalTweetsProcessed = 0;
  let totalTweetsFiltered = 0; // Rejected in step 1 (prediction check)
  let totalNoPredictionInExtraction = 0; // Passed step 1 but extraction said no
  let totalLowQuality = 0; // Rejected by quality score
  let totalExtractionErrors = 0;
  let totalPredictionsFound = 0;

  while (true) {
    try {
      const { tweets, nextCursor, hasMore } = await withRetry(() =>
        api.getTweetsNext({
          from: cursor,
          limit: env.BATCH_SIZE,
          excludeProcessedByAgent: true,
        }),
      );

      if (tweets.length === 0) {
        logger.info("No new tweets to process, sleeping...");
        await new Promise((resolve) =>
          setTimeout(resolve, env.POLL_INTERVAL_MS),
        );
        continue;
      }

      logger.info(`Processing ${tweets.length} tweets concurrently...`);
      logger.info(`Tweet IDs: ${tweets.map((t) => t.main.id).join(", ")}`);

      let batchErrors = 0;
      const extractionPromises = tweets.map((tweet) =>
        extractor
          .extractPrediction(tweet.main, tweet.context)
          .catch((error) => {
            logger.error(
              `Failed to extract prediction from tweet ${tweet.main.id}`,
              error,
            );
            batchErrors++;
            totalExtractionErrors++;
            return null;
          }),
      );
      const results = await Promise.all(extractionPromises);

      // Update stats
      totalTweetsProcessed += tweets.length;

      // TODO: We should probably actually store the null result as well
      const predictions = results.filter((r) => r !== null);

      if (predictions.length > 0) {
        totalPredictionsFound += predictions.length;
        logger.info(`Extracted ${predictions.length} predictions, storing...`);
        await withRetry(() => api.storePredictions(predictions));
        logger.info(`sent ${predictions.length} predictions`);
      }

      if (nextCursor) {
        logger.info(`Cursor advancing: ${cursor} → ${nextCursor}`);
        cursor = nextCursor;
        await withRetry(() => updateFilterCursor(cursor));
        logger.info(`persisted cursor: ${cursor}`);
      }

      // Calculate batch stats (before updating totals)
      const batchFiltered =
        extractor.stats.tweetsFiltered - totalTweetsFiltered;
      const batchNoExtraction =
        extractor.stats.noPredictionInExtraction -
        totalNoPredictionInExtraction;
      const batchLowQuality = extractor.stats.lowQuality - totalLowQuality;

      // Update running totals from extractor stats
      totalTweetsFiltered = extractor.stats.tweetsFiltered;
      totalNoPredictionInExtraction = extractor.stats.noPredictionInExtraction;
      totalLowQuality = extractor.stats.lowQuality;

      // Display batch stats
      logger.info(
        `Batch: ${predictions.length} predictions | ${batchFiltered} filtered | ${batchNoExtraction} no-prediction | ${batchLowQuality} low-quality | ${batchErrors} errors | ${tweets.length} total`,
      );
      logger.info(
        `Total: ${totalPredictionsFound} predictions | ${totalTweetsFiltered} filtered | ${totalNoPredictionInExtraction} no-prediction | ${totalLowQuality} low-quality | ${totalExtractionErrors} errors | ${totalTweetsProcessed} tweets`,
      );

      if (!hasMore) {
        logger.info("Reached end, sleeping...");
        await new Promise((resolve) =>
          setTimeout(resolve, env.POLL_INTERVAL_MS),
        );
      }
    } catch (error) {
      // todo - do we want to continue, or exit?
      logger.error("Error processing batch", error);
      await new Promise((resolve) => setTimeout(resolve, env.POLL_INTERVAL_MS));
    }
  }
}

main().catch((error) => {
  logger.error("Fatal error", error);
  process.exit(1);
});
