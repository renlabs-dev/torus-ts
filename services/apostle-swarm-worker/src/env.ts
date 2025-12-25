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
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
