import createJiti from "jiti";
import { fileURLToPath } from "url";

// Import env files to validate at build time. Use jiti so we can load .ts files in here.
createJiti(fileURLToPath(import.meta.url))("./src/env");

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,

  /** Enables hot reloading for local packages without a build step */
  transpilePackages: ["@torus-ts/api", "@torus-ts/db", "@torus-ts/ui"],

  /** We already do linting and typechecking as separate tasks in CI */
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  reactStrictMode: true,

  webpack: (config, { dev, isServer }) => {
    if (!isServer) {
      config.resolve.fallback.fs = false;
      config.resolve.fallback.tls = false;
      config.resolve.fallback.net = false;
      config.resolve.fallback.child_process = false;
    }
    if (dev && !isServer) {
      config.devtool = "eval-source-map";
      setDevTool(config, "eval-source-map");
    }

    config.module.rules.push({
      test: /\.ya?ml$/,
      use: "yaml-loader",
    });
    return config;
  },
};

function setDevTool(config, devtool = "source-map") {
  Object.defineProperty(config, "devtool", {
    get() {
      return devtool;
    },
    set() {},
  });
}

export default config;
