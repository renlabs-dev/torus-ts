import { fileURLToPath } from "url";
import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,

  // Standalone output for optimized Docker builds (~50MB vs ~500MB)
  output: "standalone",

  experimental: {
    reactCompiler: true,
    // Optimize imports for heavy packages - tree shaking
    optimizePackageImports: [
      "@hyperlane-xyz/sdk",
      "@hyperlane-xyz/widgets",
      "@hyperlane-xyz/utils",
      "@hyperlane-xyz/registry",
      "viem",
      "@wagmi/core",
      "lucide-react",
      "@polkadot/api",
      "@polkadot/util",
      "@polkadot/util-crypto",
    ],
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

  // Disable source maps in production for smaller bundles
  productionBrowserSourceMaps: false,

  /** We already do linting and typechecking as separate tasks in CI */
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  webpack: (config, { isServer }) => {
    // Optimize bundle splitting
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: "all",
        maxInitialRequests: 25,
        minSize: 20000,
        cacheGroups: {
          // Hyperlane SDK in its own chunk
          hyperlane: {
            test: /[\\/]node_modules[\\/]@hyperlane-xyz[\\/]/,
            name: "hyperlane",
            chunks: "all",
            priority: 30,
          },
          // Polkadot/Substrate packages
          polkadot: {
            test: /[\\/]node_modules[\\/]@polkadot[\\/]/,
            name: "polkadot",
            chunks: "all",
            priority: 25,
          },
          // EVM packages (viem, wagmi)
          evm: {
            test: /[\\/]node_modules[\\/](viem|@wagmi)[\\/]/,
            name: "evm",
            chunks: "all",
            priority: 20,
          },
          // Default vendor chunk for remaining packages
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            chunks: "all",
            priority: 10,
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

export default withBundleAnalyzer(config);
