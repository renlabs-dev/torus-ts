import { validateEnvOrExit } from "@torus-network/torus-utils/env";
import { z } from "zod";

/**
 * Validate and get environment variables
 */
export const getEnv = validateEnvOrExit({
  APOSTLE_SWARM_POSTGRES_URL: z.string().url(),
  TWITTERAPI_IO_KEY: z.string().min(1, "TWITTERAPI_IO_KEY is required"),
  PORT: z.string().default("3001"),
  /**
   * Number of tweets to fetch per prospect scrape.
   * API returns up to 20 tweets per page.
   */
  SCRAPE_TWEET_LIMIT: z.coerce.number().min(1).max(100).default(20),
  /**
   * Polling interval in milliseconds for checking new jobs.
   */
  JOB_POLL_INTERVAL_MS: z.coerce.number().min(1000).default(5000),

  // OpenRouter LLM configuration
  OPENROUTER_API_KEY: z.string().min(1, "OPENROUTER_API_KEY is required"),
  /**
   * Model for resonance evaluation.
   */
  EVALUATION_MODEL: z.string().default("google/gemini-2.5-flash"),
  /**
   * Model for approach strategy generation.
   */
  STRATEGY_MODEL: z.string().default("google/gemini-2.5-flash"),

  /**
   * Minimum hours between re-evaluating a prospect.
   * If lastEvaluatedAt + cooldown > now, evaluation is skipped.
   */
  EVALUATOR_COOLDOWN_HOURS: z.coerce.number().min(0).default(24),

  /**
   * Thresholds for mapping resonance score to quality tag.
   * Score >= HIGH_THRESHOLD => HIGH_POTENTIAL
   * Score >= MID_THRESHOLD => MID_POTENTIAL
   * Score >= LOW_THRESHOLD => LOW_POTENTIAL
   * Otherwise => BAD_PROSPECT
   */
  QUALITY_THRESHOLD_HIGH: z.coerce.number().min(0).max(10).default(7),
  QUALITY_THRESHOLD_MID: z.coerce.number().min(0).max(10).default(5),
  QUALITY_THRESHOLD_LOW: z.coerce.number().min(0).max(10).default(3),

  /**
   * Target Twitter handle to check if prospects follow (without @).
   * Used by CHECK_CONVERSION job to detect conversions.
   */
  TORUS_HANDLE: z.string().default("torus_network"),
});
