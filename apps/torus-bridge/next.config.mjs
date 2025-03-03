import { fileURLToPath } from "url";

// Import env files to validate at build time. Use jiti so we can load .ts files in here.
// WARNING: ONLY NEEDED IF NEXT_PUBLIC_* VARIABLES ARE USED IN THE APP DIRECTLY
// createJiti(fileURLToPath(import.meta.url))("./src/env");

/** @type {import("next").NextConfig} */
const config = {
  transpilePackages: [
    "@torus-ts/api",
    "@torus-ts/db",
    "@torus-ts/ui",
    "@torus-ts/env-validation",
  ],

  reactStrictMode: true,

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
    }

    config.module.rules.push({
      test: /\.ya?ml$/,
      use: "yaml-loader",
    });

    return config;
  },
};

export default config;
