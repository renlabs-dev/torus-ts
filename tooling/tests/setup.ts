import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import "@testing-library/jest-dom";

/**
 * Global test setup for Vitest.
 * Runs for every test file automatically.
 *
 * Features:
 * - Automatic cleanup after each test
 * - Testing Library matchers from jest-dom
 * - Common global mocks for wallet, blockchain, and UI libraries
 */

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Global mocks for common dependencies
// Mock for Zustand
vi.mock("zustand", () => ({
  create: vi.fn(() => vi.fn()),
  persist: vi.fn((config) => config),
}));

// Mock for wagmi (if needed in tests)
vi.mock("@wagmi/core", () => ({
  useAccount: () => ({ address: "0x123", isConnected: true }),
}));

// Mock for Hyperlane if used
vi.mock("@hyperlane-xyz/sdk", () => ({
  // Add mocks as needed
}));

// Other mocks can be added here as tests evolve
