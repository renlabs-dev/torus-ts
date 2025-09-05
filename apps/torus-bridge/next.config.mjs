/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,

  // Optimize build performance
  experimental: {
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

    // Use Turbopack for faster builds
    turbo: {
      rules: {
        "*.yaml": ["yaml-loader"],
        "*.yml": ["yaml-loader"],
      },
    },

    // Build optimizations enabled
  },

  transpilePackages: [
    "@torus-ts/api",
    "@torus-ts/db",
    "@torus-ts/ui",
    "@torus-network/torus-utils",
    "@torus-ts/env-validation",
  ],

  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  webpack: (config, { isServer }) => {
    // YAML loader for config files
    config.module.rules.push({
      test: /\.ya?ml$/,
      use: "yaml-loader",
    });

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

    return config;
  },
};

export default config;
