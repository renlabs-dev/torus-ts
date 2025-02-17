import typography from "@tailwindcss/typography";
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
  theme: {
    extend: {
      keyframes: {
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
      },
      animation: {
        "caret-blink": "caret-blink 1.25s ease-out infinite",
      },
    },
  },
  plugins: [typography],
} satisfies Config;
