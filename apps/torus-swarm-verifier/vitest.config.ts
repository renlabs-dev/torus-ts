import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "twitterapi",
          include: ["src/twitterapi-io/__tests__/**/*.test.ts"],
          environment: "node",
          globals: true,
          testTimeout: 30_000,
          hookTimeout: 30_000,
          pool: "threads",
          maxConcurrency: 5,
          poolOptions: {
            threads: {
              singleThread: false,
            },
          },
        },
      },
      {
        extends: true,
        test: {
          name: "deduplication",
          include: ["src/__tests__/**/*.test.ts"],
          environment: "node",
          globals: true,
        },
      },
    ],
  },
});
