import { checkSS58 } from "@torus-network/sdk/types";
import { validateEnvOrExit } from "@torus-network/torus-utils/env";
import { z } from "zod";

export const getEnv = validateEnvOrExit({
  PORT: z
    .string()
    .default("8080")
    .transform((val) => Number.parseInt(val, 10)),
  POSTGRES_URL: z.string().min(1, "POSTGRES_URL is required"),
  NEXT_PUBLIC_TORUS_RPC_URL: z
    .string()
    .nonempty("TORUS_RPC_URL is required"),
  PERMISSION_GRANTOR_ADDRESS: z
    .string()
    .min(1, "PERMISSION_GRANTOR_ADDRESS is required")
    .transform((val) => checkSS58(val)),
  PERMISSION_CACHE_REFRESH_INTERVAL_MS: z
    .string()
    .optional()
    .default("300000")
    .transform((val) => Number.parseInt(val, 10)),
  PREDICTION_APP_MNEMONIC: z
    .string()
    .min(1, "PREDICTION_APP_MNEMONIC is required for signing receipts"),
});

export type Env = ReturnType<typeof getEnv>;
