/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,

  // Disabled: React Compiler breaks tRPC proxy-based APIs
  // See docs/TRPC_CLIENT_PATTERN.md
  // reactCompiler: true,

  /** Enables hot reloading for local packages without a build step */
  transpilePackages: [
    "@torus-ts/api",
    "@torus-ts/db",
    "@torus-ts/ui",
    "@torus-ts/env-validation",
  ],

  /** We already do typechecking as separate task in CI */
  typescript: { ignoreBuildErrors: true },
};

export default config;
