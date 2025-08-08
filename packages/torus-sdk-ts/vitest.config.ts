import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        extends: true, // Inherit from root config
        test: {
          name: "unit",
          include: ["src/__tests__/**/*.test.ts"],
          exclude: ["src/__tests__/chain/**/*.test.ts"],
          environment: "node",
          globals: true,
        },
      },
      {
        extends: true, // Inherit from root config
        test: {
          name: "chain",
          include: ["src/__tests__/chain/**/*.test.ts"],
          environment: "node",
          globals: true,
          testTimeout: 30_000,
          hookTimeout: 30_000,
          pool: "threads",
          poolOptions: {
            threads: {
              // minThreads: 1,
              // maxThreads: 1,
            },
          },
          setupFiles: ["./chain.setup.ts"],
        },
      },
    ],
  },
});
