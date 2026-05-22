import path from "node:path";
import { fileURLToPath } from "node:url";

// Pin the workspace root to this monorepo (two levels up from this app), so Next
// doesn't infer an unrelated outer directory when a parent lockfile exists.
const workspaceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,

  turbopack: { root: workspaceRoot },
  /** Enables hot reloading for local packages without a build step */
  transpilePackages: [
    "@torus-ts/api",
    "@torus-ts/db",
    "@torus-ts/ui",
    "@torus-ts/env-validation",
  ],

  /** We already do linting and typechecking as separate tasks in CI */
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default config;
