import { z } from "zod";
import { buildZodEnvScript } from "@torus-ts/env-validation";

const NodeEnvSchema = z.enum(["development", "production", "test"]).default("development");
if (process?.env) {
  process.env.NEXT_PUBLIC_NODE_ENV = process.env.NODE_ENV;
}

// warning: DO NOT expose any sensitive data on the schema default values!
export const envSchema = {
  NODE_ENV: NodeEnvSchema,
  /**
   * Specify your client-side environment variables schema here.
   * For them to be exposed to the client, prefix them with `NEXT_PUBLIC_`.
   */
  NEXT_PUBLIC_CHAIN_ENV: z.enum(["mainnet", "testnet"]).default("testnet"),
  NEXT_PUBLIC_TORUS_RPC_URL: z.string().url(),
  NEXT_PUBLIC_TORUS_CACHE_URL: z.string().url(),
  NEXT_PUBLIC_VERSION: z.string().default("0.0.0"),
  NEXT_PUBLIC_REGISTRY_URL: z.string().url().optional(),
  NEXT_PUBLIC_REGISTRY_BRANCH: z.string().optional(),
  NEXT_PUBLIC_GITHUB_PROXY: z.string().url().default("https://proxy.hyperlane.xyz"),
  NEXT_PUBLIC_WALLET_CONNECT_ID: z.string().default(""),
  NEXT_PUBLIC_TRANSFER_BLACKLIST: z.string().default(""),
  NEXT_PUBLIC_CHAIN_WALLET_WHITELISTS: z.string().default("[]"),
  // NEXT_PUBLIC_TORUS_RPC_HTTPS_URL: string().url(),
  NEXT_PUBLIC_NODE_ENV: NodeEnvSchema,
};

export const { EnvScript, env } = buildZodEnvScript(envSchema, {
  skipValidation:
    !!process?.env.CI || process?.env.npm_lifecycle_event === "lint",
});
