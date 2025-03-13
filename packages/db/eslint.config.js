import baseConfig, { restrictEnvAccess } from "@torus-ts/eslint-config/base";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ["dist/**", "drizzle/**"],
  },
  ...baseConfig,
  ...restrictEnvAccess,
];
