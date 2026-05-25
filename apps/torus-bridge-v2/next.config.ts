import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import { validateEnv } from "./src/env";

// Pin the workspace root to this monorepo (two levels up from
// apps/torus-bridge-v2). Without this, Next can walk up past the repo and
// infer an unrelated outer directory as the root when a parent lockfile exists.
const workspaceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

// Validate the env schema at the entrypoint: Next loads this config when
// `next dev` / `next build` / `next start` starts, so a missing
// NEXT_PUBLIC_CLAIM_CONTRACT_ADDRESS fails fast before the server boots,
// rather than crashing on the first render.
validateEnv();

const config: NextConfig = {
  turbopack: { root: workspaceRoot },
  reactStrictMode: true,
  reactCompiler: true,
  transpilePackages: [
    "@torus-ts/ui",
    "@torus-network/torus-utils",
    "@torus-network/sdk",
    "@polkadot/extension-dapp",
    "@polkadot/extension-inject",
  ],
  typescript: { ignoreBuildErrors: true },
  productionBrowserSourceMaps: false,
  experimental: {
    optimizePackageImports: [
      "viem",
      "wagmi",
      "@rainbow-me/rainbowkit",
      "lucide-react",
    ],
  },
};

export default config;
