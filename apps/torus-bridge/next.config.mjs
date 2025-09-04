import { fileURLToPath } from "url";

// Import env files to validate at build time. Use jiti so we can load .ts files in here.
// WARNING: ONLY NEEDED IF NEXT_PUBLIC_* VARIABLES ARE USED IN THE APP DIRECTLY
// createJiti(fileURLToPath(import.meta.url))("./src/env");

/** @type {import("next").NextConfig} */
const config = {
  transpilePackages: ["@starknet-react/core", "@starknet-react/chains"],

  productionBrowserSourceMaps: false,

  // Core performance optimizations
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,

  /** We already do linting and typechecking as separate tasks in CI */
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  webpack: (config, { isServer, dev }) => {
    // Optimized webpack with parallel processing
    if (!dev) {
      // Enable webpack optimizations for production
      config.optimization = {
        ...config.optimization,
        moduleIds: "deterministic",
        chunkIds: "deterministic",
      };

      // Parallelism handled by Next.js workers instead
    }

    if (!isServer) {
      // Only essential polyfills
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: fileURLToPath(new URL("crypto-browserify", import.meta.url)),
        stream: fileURLToPath(new URL("stream-browserify", import.meta.url)),
      };
    }

    // YAML loader for config files
    config.module.rules.push({
      test: /\.ya?ml$/,
      use: "yaml-loader",
    });

    return config;
  },
};

export default config;
