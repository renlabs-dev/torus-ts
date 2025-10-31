import { fileURLToPath } from "url";

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,

  experimental: {
    reactCompiler: true,
    // Optimize imports for heavy packages
    optimizePackageImports: [
      "@hyperlane-xyz/sdk",
      "@hyperlane-xyz/widgets",
      "@solana/web3.js",
      "@solana/wallet-adapter-react",
      "@cosmos-kit/react",
      "@starknet-react/core",
      "starknet",
    ],

    // Build optimizations for faster builds
    webpackBuildWorker: true,
  },

  // Use Turbopack for faster builds
  turbopack: {},

  transpilePackages: [
    "@torus-ts/api",
    "@torus-ts/db",
    "@torus-ts/ui",
    "@torus-network/torus-utils",
    "@torus-ts/env-validation",
  ],

  productionBrowserSourceMaps: true,

  /** We already do linting and typechecking as separate tasks in CI */
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  webpack: (config, { isServer }) => {
    // Optimize bundle splitting
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
            priority: 10,
          },
          wallet: {
            test: /[\\/]node_modules[\\/](@solana|@cosmos-kit|@starknet|@hyperlane)[\\/]/,
            name: "wallet-vendors",
            chunks: "all",
            priority: 20,
          },
        },
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

// test again