import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        extends: true, // Inherit from root config
        test: {
          name: "unit",
          include: ["src/__tests__/**/*.test.ts"],
          exclude: [
            "src/__tests__/chain-query/**/*.test.ts",
            "src/__tests__/chain-tx/**/*.test.ts",
          ],
          environment: "node",
          globals: true,
        },
      },
      {
        extends: true, // Inherit from root config
        test: {
          name: "chain-query",
          include: ["src/__tests__/chain-query/**/*.test.ts"],
          environment: "node",
          globals: true,
          testTimeout: 30_000,
          hookTimeout: 30_000,
          pool: "threads",
          // TODO: check if query tests can be run in parallel
          maxConcurrency: 1,
          poolOptions: {
            threads: {
              singleThread: true,
            },
          },
          setupFiles: ["./src/testing/chain.setup.ts"],
        },
      },
      {
        extends: true, // Inherit from root config
        test: {
          name: "chain-tx",
          include: ["src/__tests__/chain-tx/**/*.test.ts"],
          environment: "node",
          globals: true,
          testTimeout: 60_000,
          hookTimeout: 60_000,
          pool: "threads",
          maxConcurrency: 1,
          poolOptions: {
            threads: {
              singleThread: true,
            },
          },
          setupFiles: ["./src/testing/chain.setup.ts"],
        },
      },
    ],
  },
});
