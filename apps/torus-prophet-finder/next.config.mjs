/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,
  images: {
    // Allow local dev assets and specific remote hosts used by the app
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "3004" },
      { protocol: "https", hostname: "encrypted-tbn0.gstatic.com" },
      { protocol: "https", hostname: "pbs.twimg.com" },
    ],
  },
  /** Enables hot reloading for local packages without a build step */
  transpilePackages: [
    "@torus-ts/api",
    "@torus-ts/db",
    "@torus-ts/ui",
    "@torus-ts/env-validation",
  ],

  /** We already do linting and typechecking as separate tasks in CI */
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default config;
