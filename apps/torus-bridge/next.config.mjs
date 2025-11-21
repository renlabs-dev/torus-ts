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
    // Build optimizations enabled
  },

  // Use Turbopack for faster builds
  turbopack: {
    rules: {
      "*.yaml": ["yaml-loader"],
      "*.yml": ["yaml-loader"],
    },
  },

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

  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      // Replace node: protocol imports with their browser versions
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
          resource.request = resource.request.replace(/^node:/, "");
        }),
      );

      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        util: fileURLToPath(new URL("util/", import.meta.url)),
        crypto: fileURLToPath(new URL("crypto-browserify", import.meta.url)),
        stream: fileURLToPath(new URL("stream-browserify", import.meta.url)),
        events: fileURLToPath(new URL("events/", import.meta.url)),
        process: fileURLToPath(new URL("process/browser", import.meta.url)),
      };

      // Optimize bundle splitting
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
