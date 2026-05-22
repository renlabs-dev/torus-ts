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

  reactCompiler: true,

  /** Enables hot reloading for local packages without a build step */
  transpilePackages: [
    "@torus-ts/api",
    "@torus-ts/db",
    "@torus-ts/ui",
    "@torus-network/torus-utils",
    "@torus-ts/env-validation",
  ],

  /** We already do typechecking as separate task in CI */
  typescript: { ignoreBuildErrors: true },

  async headers() {
    return [
      {
        source: "/:path*.(svg|jpg|png|ico|webp)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
};

export default config;
