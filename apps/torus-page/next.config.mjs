/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,

  reactCompiler: true,

  /** Enables hot reloading for local packages without a build step */
  transpilePackages: ["@torus-ts/ui", "@torus-ts/env-validation"],

  /** We already do typechecking as separate task in CI */
  typescript: { ignoreBuildErrors: true },
};

export default config;
