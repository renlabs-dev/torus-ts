import { buildZodEnvScript } from "@torus-ts/env-validation";
import { z } from "zod";

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
  NODE_ENV: NodeEnvSchema,
  BASE_URL: z
    .string()
    .default(
      process.env.NODE_ENV === "production"
        ? "https://bridge.torus.network"
        : "https://bridge.testnet.torus.network",
    ),
  /*
   * Specify your client-side environment variables schema here.
   * For them to be exposed to the client, prefix them with `NEXT_PUBLIC_`.
   */
  NEXT_PUBLIC_TORUS_CHAIN_ENV: z.enum(["mainnet", "testnet"]),
  NEXT_PUBLIC_TORUS_RPC_URL: z.string().url(),
  NEXT_PUBLIC_TORUS_CACHE_URL: z.string().url(),
  NEXT_PUBLIC_VERSION: z.string().default("0.0.0"),
  NEXT_PUBLIC_REGISTRY_URL: z.string().url().optional(),
  NEXT_PUBLIC_REGISTRY_BRANCH: z.string().optional(),
  NEXT_PUBLIC_GITHUB_PROXY: z
    .string()
    .url()
    .default("https://proxy.hyperlane.xyz"),
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
