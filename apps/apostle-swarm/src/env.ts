import { validateEnvOrExit } from "@torus-network/torus-utils/env";
import { z } from "zod";

const envSchema = {
  APOSTLE_SWARM_POSTGRES_URL: z.string().min(1),
  TWITTER_API_KEY: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().default("anthropic/claude-3.5-sonnet"),
  OPENAI_API_KEY: z.string().optional(),
  MAX_TWEETS_PER_ACCOUNT: z
    .string()
    .default("100")
    .transform((v) => parseInt(v, 10)),
};

export const env = validateEnvOrExit(envSchema)(process.env);

export type Env = typeof env;
