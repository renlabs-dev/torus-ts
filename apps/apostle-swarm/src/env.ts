import { validateEnvOrExit } from "@torus-network/torus-utils/env";
import { z } from "zod";

const envSchema = {
  APOSTLE_SWARM_POSTGRES_URL: z.string().min(1),
};

export const env = validateEnvOrExit(envSchema)(process.env);

export type Env = typeof env;
