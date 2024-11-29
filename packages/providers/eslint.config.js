import baseConfig, { restrictEnvAccess } from "@torus-ts/eslint-config/base";
import nextjsConfig from "@torus-ts/eslint-config/nextjs";
import reactConfig from "@torus-ts/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [".next/**"],
  },
  ...baseConfig,
  ...reactConfig,
  ...nextjsConfig,
  ...restrictEnvAccess,
  {
    rules: {
      "no-html-link-for-pages": "off",
    },
  },
];
