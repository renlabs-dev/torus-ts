import { z } from "zod";
import { buildZodEnvScript } from "@torus-ts/env-validation";

const NodeEnvSchema = z.enum(["development", "production", "test"])

const EnvSchema = z.object({
  NODE_ENV: NodeEnvSchema.default("development"),
  /**
   * Specify your client-side environment variables schema here.
   * For them to be exposed to the client, prefix them with `NEXT_PUBLIC_`.
   */
  NEXT_PUBLIC_TORUS_RPC_URL: z.string().url(),
  NEXT_PUBLIC_TORUS_CACHE_URL: z.string().url(),
  NEXT_PUBLIC_NODE_ENV: NodeEnvSchema.default(() => process.env.NODE_ENV),
})

export const { EnvScript, env } = buildZodEnvScript(EnvSchema, {
  skipValidation: !!process.env.CI || process.env.npm_lifecycle_event === "lint",
})
