import baseConfig, { restrictEnvAccess } from "@torus-ts/eslint-config/base";
import nextjsConfig from "@torus-ts/eslint-config/nextjs";
import reactConfig from "@torus-ts/eslint-config/react";
import tseslint from "typescript-eslint";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [".next/**"],
  },
  ...baseConfig,
  ...reactConfig,
  ...nextjsConfig,
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
];
