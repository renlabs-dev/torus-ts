import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

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
  server: {},
  /**
   * Specify your client-side environment variables schema here.
   * For them to be exposed to the client, prefix them with `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_CHAIN_ENV: z.enum(["mainnet", "testnet"]).default("testnet"),
    NEXT_PUBLIC_TORUS_RPC_URL: z.string().url(),
    NEXT_PUBLIC_TORUS_CACHE_URL: z.string().url(),
    // NEXT_PUBLIC_TORUS_RPC_HTTPS_URL: string().url(),
  },
  /**
   * Destructure all variables from `process.env` to make sure they aren't tree-shaken away.
   */
  experimental__runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_CHAIN_ENV: process.env.NEXT_PUBLIC_CHAIN_ENV,
    NEXT_PUBLIC_TORUS_RPC_URL: process.env.NEXT_PUBLIC_TORUS_RPC_URL,
    NEXT_PUBLIC_TORUS_CACHE_URL: process.env.NEXT_PUBLIC_TORUS_CACHE_URL,
    // NEXT_PUBLIC_TORUS_RPC_HTTPS_URL: process.env.NEXT_PUBLIC_TORUS_RPC_HTTPS_URL,
  },
  skipValidation:
    !!process.env.CI || process.env.npm_lifecycle_event === "lint",
});
