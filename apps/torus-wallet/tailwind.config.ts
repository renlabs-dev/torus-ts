import baseConfig from "@torus-ts/ui/tailwind.config";

export default {
  ...baseConfig,
  theme: {
    ...(baseConfig.theme || {}),
    extend: {
      ...(baseConfig.theme?.extend || {}),
      animation: {
        slide: "slide 2.5s linear infinite",
        marquee: "marquee 80s linear infinite",
        "fade-up": "fade-up 0.8s ease-out",
      },
      keyframes: {
        slide: {
          "0%": { transform: "translateX(-500px)" },
          "100%": { transform: "translateX(500px)" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [...(baseConfig.plugins || [])],
};
