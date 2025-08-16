import "dotenv/config";

import { z } from "zod";

import { validateEnvOrExit } from "@torus-network/torus-utils/env";
import { memo } from "@torus-network/torus-utils/misc";

/**
 * Environment configuration for chain tests.
 */
const testingEnvVarsSchema = {
  TEST_CHAIN_RPC_URL: z.string().url(),
};

/**
 * Lazily parse and cache environment variables.
 */
export const getEnv = memo(() =>
  validateEnvOrExit(testingEnvVarsSchema)(process.env),
);
