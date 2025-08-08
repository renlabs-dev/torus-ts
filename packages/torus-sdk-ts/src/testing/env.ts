import "dotenv/config";

import { z } from "zod";

import { memo } from "@torus-network/torus-utils/misc";

/**
 * Environment configuration for chain tests.
 * Validates required environment variables using Zod.
 */
const envSchema = z.object({
  CHAIN_RPC_URL: z.string().url().default("wss://api.testnet.torus.network"),
});

/**
 * Lazily parse and cache environment variables.
 */
export const getEnv = memo(() => envSchema.parse(process.env));
