// @ts-nocheck
import { fileURLToPath } from "url";

/** @typedef {import("prettier").Config} PrettierConfig */
/** @typedef {import("prettier-plugin-tailwindcss").PluginOptions} TailwindConfig */

/** @type { PrettierConfig | SortImportsConfig | TailwindConfig } */
const config = {
  plugins: ["prettier-plugin-tailwindcss"],
  tailwindConfig: fileURLToPath(
    new URL("../../tooling/tailwind/web.ts", import.meta.url),
  ),
  tailwindFunctions: ["cn", "cva"],
  // importOrder: [
  //   "<TYPES>",
  //   "^(react/(.*)$)|^(react$)|^(react-native(.*)$)",
  //   "^(next/(.*)$)|^(next$)",
  //   "^(expo(.*)$)|^(expo$)",
  //   "<THIRD_PARTY_MODULES>",
  //   "",
  //   "<TYPES>^@torus-ts",
  //   "^@torus-ts/(.*)$",
  //   "",
  //   "<TYPES>^[.|..|~]",
  //   "^~/",
  //   "^[../]",
  //   "^[./]",
  // ],
  // importOrderParserPlugins: ["typescript", "jsx", "decorators-legacy"],
  // importOrderTypeScriptVersion: "4.4.0",
  overrides: [
    {
      files: "*.json.hbs",
      options: {
        parser: "json",
      },
    },
    {
      files: "*.js.hbs",
      options: {
        parser: "babel",
      },
    },
  ],
};

export default config;
