import { fileURLToPath } from "url";
import { dirname } from "path";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import("next").NextConfig} */
const config = {
  transpilePackages: [
    "@torus-ts/api",
    "@torus-ts/db",
    "@torus-ts/ui",
    "@torus-ts/env-validation",
  ],

  productionBrowserSourceMaps: true,
  reactStrictMode: true,

  /** We already do linting and typechecking as separate tasks in CI */
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  // Modify webpack config to optimize build and fix browser environment issues
  webpack: (config, { isServer, webpack }) => {
    if (!isServer) {
      // Replace node: protocol imports with their browser versions
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
          resource.request = resource.request.replace(/^node:/, "");
        }),
      );

      // Add more robust fallbacks for browser environment
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        util: fileURLToPath(new URL("node_modules/util/", import.meta.url)),
        crypto: fileURLToPath(
          new URL("node_modules/crypto-browserify", import.meta.url),
        ),
        stream: fileURLToPath(
          new URL("node_modules/stream-browserify", import.meta.url),
        ),
        events: fileURLToPath(new URL("node_modules/events/", import.meta.url)),
        process: fileURLToPath(
          new URL("node_modules/process/browser", import.meta.url),
        ),
        buffer: fileURLToPath(new URL("node_modules/buffer/", import.meta.url)),
        path: fileURLToPath(
          new URL("node_modules/path-browserify", import.meta.url),
        ),
        os: fileURLToPath(
          new URL("node_modules/os-browserify/browser", import.meta.url),
        ),
      };

      // Add webpack plugins to properly handle polyfills
      config.plugins.push(
        new webpack.ProvidePlugin({
          process: "process/browser",
          Buffer: ["buffer", "Buffer"],
        }),
      );
    }

    // Add YAML loader
    config.module.rules.push({
      test: /\.ya?ml$/,
      use: "yaml-loader",
    });

    // Configure code splitting with a simpler approach
    config.optimization.splitChunks = {
      chunks: "all",
      maxInitialRequests: 20,
      maxAsyncRequests: 20,
      minSize: 20000,
      cacheGroups: {
        // Separate chunk for CSS files
        styles: {
          name: "styles",
          test: /\.css$/,
          chunks: "all",
          enforce: true,
          priority: 20,
        },
        // Vendor chunk for node_modules
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendor",
          priority: 10,
          chunks: "all",
        },
      },
    };

    // Add circular dependency detection when analyzing
    if (process.env.ANALYZE === "true") {
      const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");
      config.plugins.push(new BundleAnalyzerPlugin());
    }

    // Improve caching for faster rebuilds
    config.cache = {
      type: "filesystem",
      buildDependencies: {
        config: [__filename],
      },
    };

    // Reduce unnecessary recompilation
    config.watchOptions = {
      ignored: /node_modules/,
    };

    return config;
  },
};

export default config;
