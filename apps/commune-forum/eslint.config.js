import baseConfig, { restrictEnvAccess } from "@commune-ts/eslint-config/base";
import nextjsConfig from "@commune-ts/eslint-config/nextjs";
import reactConfig from "@commune-ts/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [".next/**"],
  },
  ...baseConfig,
  ...reactConfig,
  ...nextjsConfig,
  ...restrictEnvAccess,
];
