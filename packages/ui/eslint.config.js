import baseConfig from "@torus-ts/eslint-config/base";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [],
  },
  ...baseConfig,
  {
    rules: {
      // Prohibit direct usage of `process.env.*` in the UI package.
      // All environment variables should be explicitly passed by the consuming applications.
      // This ensures better encapsulation, reusability, and testability of UI components,
      "no-process-env": "error",
    },
  },
];
