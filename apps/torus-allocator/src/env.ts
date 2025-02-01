import { z } from "zod";
import { buildZodEnvScript } from "@torus-ts/env-validation";

const AUTH_ORIGIN_DEFAULT = "validator.torus.network";

const NodeEnvSchema = z.enum(["development", "production", "test"]).default("development");
if (process?.env) { // using Reflect to avoid inlining by Next  https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables#bundling-environment-variables-for-the-browser
  Reflect.set(process.env, "NEXT_PUBLIC_NODE_ENV", process.env.NODE_ENV);
}

// warning: DO NOT expose any sensitive data on the schema default values!
export const envSchema = {
  NODE_ENV: NodeEnvSchema.default("development"),
  JWT_SECRET: z.string().min(8),
  POSTGRES_URL: z.string().url(),
  PORT: z.string(),
  /**
   * Specify your client-side environment variables schema here.
   * For them to be exposed to the client, prefix them with `NEXT_PUBLIC_`.
   */
  /** Origin URI used in the statement signed by the user to authenticate */
  NEXT_PUBLIC_AUTH_ORIGIN: z.string().default(AUTH_ORIGIN_DEFAULT), // Origin URI used in the statement signed by the user to authenticate
  NEXT_PUBLIC_TORUS_RPC_URL: z.string().url(),
  NEXT_PUBLIC_TORUS_CACHE_URL: z.string().url(),
  NEXT_PUBLIC_NODE_ENV: NodeEnvSchema,
  TORUS_ALLOCATOR_ADDRESS: z.string(),
};

export const { EnvScript, env } = buildZodEnvScript(envSchema, {
  skipValidation:
    !!process?.env.CI || process?.env.npm_lifecycle_event === "lint",
});
