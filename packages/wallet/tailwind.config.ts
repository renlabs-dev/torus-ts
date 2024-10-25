import type { Config } from "tailwindcss";

import baseConfig from "@torus-ts/tailwind-config/web";

const config: Config = {
  content: ["./src/**/*.tsx"],
  prefix: "tw-",
  presets: [baseConfig],
};

export default config;
