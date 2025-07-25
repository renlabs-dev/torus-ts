import { z } from "zod";

import { SS58_SCHEMA } from "@torus-network/sdk/types";

import { buildZodEnvScript } from "@torus-ts/env-validation";
import { chainEnvSchema } from "@torus-ts/ui/lib/data";

const AUTH_ORIGIN_DEFAULT = "dao.torus.network";

const NodeEnvSchema = z
  .enum(["development", "production", "test"])
  .default("development");

if (process?.env) {
  // using Reflect to avoid inlining by Next
  // https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables#bundling-environment-variables-for-the-browser
  Reflect.set(process.env, "NEXT_PUBLIC_NODE_ENV", process.env.NODE_ENV);
}

// warning: DO NOT expose any sensitive data on the schema default values!
export const envSchema = {
  NODE_ENV: NodeEnvSchema.default("development"),
  JWT_SECRET: z.string().min(8),
  POSTGRES_URL: z.string().url(),
  PINATA_JWT: z.string(),
  PORT: z.string(),

  // Discord Authentication
  DISCORD_CLIENT_ID: z.string().nonempty(),
  DISCORD_CLIENT_SECRET: z.string().nonempty(),
  DISCORD_REDIRECT_URL: z.string().url(),
  DISCORD_BOT_SECRET: z.string().nonempty(),

  /**
   * Specify your client-side environment variables schema here.
   * For them to be exposed to the client, prefix them with `NEXT_PUBLIC_`.
   */
  /** Origin URI used in the statement signed by the user to authenticate */
  NEXT_PUBLIC_AUTH_ORIGIN: z.string().default(AUTH_ORIGIN_DEFAULT),
  NEXT_PUBLIC_TORUS_RPC_URL: z.string().url(),
  NEXT_PUBLIC_TORUS_CACHE_URL: z.string().url(),
  NEXT_PUBLIC_NODE_ENV: NodeEnvSchema,
  NEXT_PUBLIC_TORUS_ALLOCATOR_ADDRESS: SS58_SCHEMA,
  NEXT_PUBLIC_TORUS_CHAIN_ENV: chainEnvSchema,
};

export const { EnvScript, env } = buildZodEnvScript(envSchema, {
  skipValidation:
    !!process?.env.CI || process?.env.npm_lifecycle_event === "lint",
});
