import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    reporters: ["verbose"],
    testTimeout: 40_000,
  },
});
