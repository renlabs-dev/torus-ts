import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    APOSTLE_SWARM_POSTGRES_URL: z.string().url(),
    TWITTERAPI_IO_KEY: z.string().min(1),
    PORT: z.string().default("3001"),
    /**
     * Number of tweets to fetch per prospect scrape.
     * API returns up to 20 tweets per page.
     */
    SCRAPE_TWEET_LIMIT: z
      .string()
      .transform(Number)
      .pipe(z.number().min(1).max(100))
      .default("20"),
    /**
     * Polling interval in milliseconds for checking new jobs.
     */
    JOB_POLL_INTERVAL_MS: z
      .string()
      .transform(Number)
      .pipe(z.number().min(1000))
      .default("5000"),

    // OpenRouter LLM configuration
    OPENROUTER_API_KEY: z.string().min(1),
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
    EVALUATOR_COOLDOWN_HOURS: z
      .string()
      .transform(Number)
      .pipe(z.number().min(0))
      .default("24"),

    /**
     * Thresholds for mapping resonance score to quality tag.
     * Score >= HIGH_THRESHOLD => HIGH_POTENTIAL
     * Score >= MID_THRESHOLD => MID_POTENTIAL
     * Score >= LOW_THRESHOLD => LOW_POTENTIAL
     * Otherwise => BAD_PROSPECT
     */
    QUALITY_THRESHOLD_HIGH: z
      .string()
      .transform(Number)
      .pipe(z.number().min(0).max(10))
      .default("7"),
    QUALITY_THRESHOLD_MID: z
      .string()
      .transform(Number)
      .pipe(z.number().min(0).max(10))
      .default("5"),
    QUALITY_THRESHOLD_LOW: z
      .string()
      .transform(Number)
      .pipe(z.number().min(0).max(10))
      .default("3"),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
