import { buildZodEnvScript } from "@torus-ts/env-validation";
import { chainEnvSchema } from "@torus-ts/ui/lib/data";
import { z } from "zod";

const NodeEnvSchema = z
  .enum(["development", "production", "test"])
  .default("development");
if (process?.env) {
  // using Reflect to avoid inlining by Next  https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables#bundling-environment-variables-for-the-browser
  Reflect.set(process.env, "NEXT_PUBLIC_NODE_ENV", process.env.NODE_ENV);
}

// warning: DO NOT expose any sensitive data on the schema default values!
export const envSchema = {
  NODE_ENV: NodeEnvSchema.default("development"),
  BASE_URL: z
    .string()
    .default(
      process.env.NODE_ENV === "production"
        ? "https://torus.network"
        : "https://testnet.torus.network",
    ),

  /**
   * Specify your client-side environment variables schema here.
   * For them to be exposed to the client, prefix them with `NEXT_PUBLIC_`.
   */
  NEXT_PUBLIC_NODE_ENV: NodeEnvSchema,
  NEXT_PUBLIC_TORUS_CHAIN_ENV: chainEnvSchema,
  NEXT_PUBLIC_GA_ID: z.string().default("G-7YCMH64Q4J"),
};

export const { EnvScript, env } = buildZodEnvScript(envSchema, {
  skipValidation:
    !!process?.env.CI || process?.env.npm_lifecycle_event === "lint",
});
