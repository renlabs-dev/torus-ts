/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,

  transpilePackages: [
    "@torus-ts/api",
    "@torus-ts/db",
    "@torus-ts/ui",
    "@torus-network/torus-utils",
    "@torus-ts/env-validation",
  ],

  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  webpack: (config) => {
    // YAML loader for config files
    config.module.rules.push({
      test: /\.ya?ml$/,
      use: "yaml-loader",
    });

    return config;
  },
};

export default config;
