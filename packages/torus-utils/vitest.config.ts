import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.ts"],
          exclude: ["src/**/__tests__/**/*.test.ts"],
          environment: "node",
          globals: true,
        },
      },
      {
        extends: true,
        test: {
          name: "swarm-memory",
          include: ["src/swarm-memory-client/__tests__/**/*.test.ts"],
          environment: "node",
          globals: true,
          testTimeout: 10_000,
          hookTimeout: 10_000,
        },
      },
    ],
  },
});
