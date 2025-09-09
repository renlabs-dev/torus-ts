import baseConfig from "@torus-ts/eslint-config/base";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: ["dist/**", "node_modules/**", "src/types/**"],
  },
  ...baseConfig,
  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.lint.json",
      },
    },
  },
];
