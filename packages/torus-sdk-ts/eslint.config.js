import baseConfig from "@torus-ts/eslint-config/base";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ["dist/**", "src/interfaces/**", "src/__tests__/**"],
  },
  ...baseConfig,
];
