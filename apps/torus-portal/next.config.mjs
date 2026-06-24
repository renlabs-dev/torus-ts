import path from "node:path";
import { fileURLToPath } from "node:url";

// Pin the workspace root to this monorepo (two levels up from this app), so Next
// doesn't infer an unrelated outer directory when a parent lockfile exists.
const workspaceRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

// Portal app taken down during chain hibernation (2026-06): the agent /
// permissions / allocator UI is removed from torus.network while the chain is
// dormant. All portal routes 302 to the landing splash instead of serving.
// Temporary — delete `removedPortalRoutes` + the `redirects()` below to restore.
const removedPortalRoutes = [
  "portal",
  "capabilities",
  "constraints",
  "network-operations",
  "permissions",
  "playground",
  "root-allocator",
  "signals",
];

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,

  turbopack: { root: workspaceRoot },

  async redirects() {
    return removedPortalRoutes.flatMap((route) => [
      { source: `/${route}`, destination: "/", permanent: false },
      { source: `/${route}/:path*`, destination: "/", permanent: false },
    ]);
  },

  // Disabled: React Compiler breaks tRPC proxy-based APIs
  // See docs/TRPC_CLIENT_PATTERN.md
  // reactCompiler: true,

  /** Enables hot reloading for local packages without a build step */
  transpilePackages: [
    "@torus-ts/api",
    "@torus-ts/db",
    "@torus-ts/ui",
    "@torus-ts/env-validation",
  ],

  /** We already do typechecking as separate task in CI */
  typescript: { ignoreBuildErrors: true },
};

export default config;
