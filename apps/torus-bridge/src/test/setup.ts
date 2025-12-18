/**
 * Fast Bridge test setup
 *
 * Imports base setup from @torus-ts/vitest-config with common mocks for:
 * - Zustand
 * - wagmi
 * - Hyperlane SDK
 * - Testing Library matchers
 *
 * Add project-specific mocks below as needed.
 */
import "@torus-ts/vitest-config/setup";
import { vi } from "vitest";

// Configure Testing Library to show cleaner error messages
import { configure } from "@testing-library/react";

configure({
  getElementError: (message, _container) => {
    const error = new Error(message ?? "");
    error.name = "TestingLibraryElementError";
    error.stack = error.stack?.split("\n").slice(0, 10).join("\n");
    return error;
  },
});

// Mock config module globally for all tests
vi.mock("~/config", () => ({
  getChainValuesOnEnv: () => () => ({ chainId: 8453 }),
  contractAddresses: {
    base: {
      mainnet: { torusErc20: "0x78EC15C5FD8EfC5e924e9EEBb9e549e29C785867" },
      testnet: { torusErc20: "0x78EC15C5FD8EfC5e924e9EEBb9e549e29C785867" },
    },
  },
}));

vi.mock("~/env", () => ({
  env: (key: string) => {
    if (key === "NEXT_PUBLIC_TORUS_CHAIN_ENV") return "testnet";
    return "";
  },
}));
