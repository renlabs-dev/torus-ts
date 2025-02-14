import baseConfig from "@torus-ts/tailwind-config/web";
import type { Config } from "tailwindcss";

export default {
  // We need to append the path to the UI package to the content array so that
  // those classes are included correctly.
  content: [
    ...baseConfig.content,
    "../../packages/ui/src/components/*.{ts,tsx}",
  ],
  presets: [baseConfig],
  theme: {},
} satisfies Config;
