import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const AUTH_ORIGIN_DEFAULT = "validator.torus.network";

export const env = createEnv({
  shared: {
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },
  /**
   * Specify your server-side environment variables schema here.
   * This way you can ensure the app isn't built with invalid env vars.
   */
  server: {
    JWT_SECRET: z.string().min(8),
    POSTGRES_URL: z.string().url(),
  },
  /**
   * Specify your client-side environment variables schema here.
   * For them to be exposed to the client, prefix them with `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_AUTH_ORIGIN: z.string().default(AUTH_ORIGIN_DEFAULT), // Origin URI used in the statement signed by the user to authenticate
    NEXT_PUBLIC_WS_PROVIDER_URL: z.string().url(),
    NEXT_PUBLIC_CACHE_PROVIDER_URL: z.string().url(),
  },
  /**
   * Destructure all variables from `process.env` to make sure they aren't tree-shaken away.
   */
  experimental__runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_AUTH_ORIGIN: process.env.NEXT_PUBLIC_AUTH_ORIGIN,
    NEXT_PUBLIC_WS_PROVIDER_URL: process.env.NEXT_PUBLIC_WS_PROVIDER_URL,
    NEXT_PUBLIC_CACHE_PROVIDER_URL: process.env.NEXT_PUBLIC_CACHE_PROVIDER_URL,
  },
  skipValidation:
    !!process.env.CI || process.env.npm_lifecycle_event === "lint",
});
