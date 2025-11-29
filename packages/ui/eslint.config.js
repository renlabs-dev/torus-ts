import baseConfig, { restrictEnvAccess } from "@torus-ts/eslint-config/base";
import reactConfig from "@torus-ts/eslint-config/react";
import tseslint from "typescript-eslint";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [".next/**"],
  },
  ...baseConfig,
  ...reactConfig,
  ...restrictEnvAccess,
  ...tseslint.config({
    files: ["src/**/*.{js,ts,tsx}"],
    rules: {
      "no-restricted-properties": [
        "error",
        {
          object: "process",
          property: "env",
          message:
            "Direct usage of `process.env` is prohibited in the UI package. Environment variables must be explicitly passed by consuming applications to ensure better encapsulation, reusability, and testability of UI components.",
        },
      ],
    },
  }),
  {
    rules: {
      // TODO: Fix type safety issues with Result<T,E> pattern and remove these overrides
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-redundant-type-constituents": "off",
    },
  },
];
