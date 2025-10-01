import reactPlugin from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";

/** @type {Awaited<import('typescript-eslint').Config>} */
export default [
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      react: reactPlugin,
      "react-hooks": hooksPlugin,
    },
    rules: {
      ...reactPlugin.configs["jsx-runtime"].rules,
      ...hooksPlugin.configs.recommended.rules,
      // Disabled for now due to compatibility issues with react-compiler,
      // which still appears to be experimental in the Next.js ecosystem.
      // When it is no longer experimental, remove this deactivation.
      // @rodrigooler
      "react-hooks/preserve-manual-memoization": "off",
    },
    languageOptions: {
      globals: {
        React: "writable",
      },
    },
  },
];
