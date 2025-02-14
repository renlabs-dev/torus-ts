import base from "./base";
import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";
import animated from "tailwindcss-animated";

export default {
  content: base.content,
  presets: [base],
  theme: {
    extend: {
      colors: {
        "section-gray": "rgba(137, 137, 137, 0.05)",
        "section-stroke": "rgba(255, 255, 255, 0.1)",
      },
      animation: {
        "fade-in-down": "fade-in-down 0.6s ease-in-out",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      keyframes: {
        "fade-in-down": {
          "0%": {
            opacity: "0",
            transform: "translateY(-20px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      boxShadow: {
        "custom-green": "0px 0px 12px 0 rgba(34, 197, 94, 0.90)",
        "custom-white": "0px 0px 12px 0 rgba(255, 255, 255, 0.90)",
        "custom-gray": "0px 0px 12px 0 rgba(156, 163, 175, 0.90)",
      },
    },
  },
  plugins: [animate, animated],
} satisfies Config;
