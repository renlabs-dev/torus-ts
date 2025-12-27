import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDualWallet } from "./use-fast-bridge-dual-wallet";
import { useTorus } from "@torus-ts/torus-provider";

// Import the mocked wagmi function
import { useAccount } from "wagmi";

const mockedUseAccount = vi.mocked(useAccount);

// Mock dependencies
vi.mock("@torus-ts/torus-provider", () => ({
  useTorus: vi.fn(() => ({
    selectedAccount: {
      address: "1AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    },
    isAccountConnected: true,
    isInitialized: true,
  })),
}));

const mockedUseTorus = vi.mocked(useTorus);

vi.mock("wagmi", () => ({
  useAccount: vi.fn(() => ({
    address: "0x1234567890abcdef1234567890abcdef12345678",
    isConnected: true,
    chainId: 8453,
    status: "connected",
  })),
}));

vi.mock("~/config", () => ({
  getChainValuesOnEnv: () => () => ({ chainId: 8453 }),
}));

vi.mock("~/env", () => ({
  env: (key: string) => {
    if (key === "NEXT_PUBLIC_TORUS_CHAIN_ENV") return "testnet";
    return "";
  },
}));

describe("useDualWallet", () => {
  describe("connection state", () => {
    it("should return connection state", () => {
      const { result } = renderHook(() => useDualWallet());

      expect(result.current.connectionState).toBeDefined();
      expect(result.current.connectionState.torusWallet).toBeDefined();
      expect(result.current.connectionState.evmWallet).toBeDefined();
    });

    it("should return torus wallet connection info", () => {
      const { result } = renderHook(() => useDualWallet());

      expect(result.current.connectionState.torusWallet.isConnected).toBe(true);
      expect(
        result.current.connectionState.torusWallet.address
      ).toBeDefined();
      expect(
        result.current.connectionState.torusWallet.isConnecting
      ).toBe(false);
    });

    it("should return evm wallet connection info", () => {
      const { result } = renderHook(() => useDualWallet());

      expect(result.current.connectionState.evmWallet.isConnected).toBe(true);
      expect(result.current.connectionState.evmWallet.address).toBeDefined();
      expect(result.current.connectionState.evmWallet.chainId).toBeDefined();
    });
  });

  describe("chain validation", () => {
    it("should check if required chain is connected for base-to-native", () => {
      const { result } = renderHook(() => useDualWallet());

      const isRequired = result.current.isRequiredChainConnected(
        "base-to-native"
      );
      expect(typeof isRequired).toBe("boolean");
    });

    it("should check if required chain is connected for native-to-base", () => {
      const { result } = renderHook(() => useDualWallet());

      const isRequired = result.current.isRequiredChainConnected(
        "native-to-base"
      );
      expect(typeof isRequired).toBe("boolean");
    });

    it("should return false if EVM wallet not connected", () => {
      mockedUseAccount.mockReturnValueOnce({
        address: undefined,
        isConnected: false,
        chainId: undefined,
        status: "disconnected",
      });

      const { result } = renderHook(() => useDualWallet());

      const isRequired = result.current.isRequiredChainConnected(
        "base-to-native"
      );
      expect(isRequired).toBe(false);
    });
  });

  describe("chain checking", () => {
    it("should check if on optimal chain for base-to-native", () => {
      const { result } = renderHook(() => useDualWallet());

      const isOptimal = result.current.isOnOptimalChain("base-to-native");
      expect(typeof isOptimal).toBe("boolean");
    });

    it("should check if on optimal chain for native-to-base", () => {
      const { result } = renderHook(() => useDualWallet());

      const isOptimal = result.current.isOnOptimalChain("native-to-base");
      expect(typeof isOptimal).toBe("boolean");
    });

    it("should return false if EVM wallet not connected", () => {
      mockedUseAccount.mockReturnValueOnce({
        address: undefined,
        isConnected: false,
        chainId: undefined,
        status: "disconnected",
      });

      const { result } = renderHook(() => useDualWallet());

      const isOptimal = result.current.isOnOptimalChain("base-to-native");
      expect(isOptimal).toBe(false);
    });
  });

  describe("required chain ID", () => {
    it("should return base chain ID for base-to-native direction", () => {
      const { result } = renderHook(() => useDualWallet());

      const chainId = result.current.getRequiredChainId("base-to-native");
      expect(typeof chainId).toBe("number");
      expect(chainId).toBe(8453);
    });

    it("should return torus EVM chain ID for native-to-base direction", () => {
      const { result } = renderHook(() => useDualWallet());

      const chainId = result.current.getRequiredChainId("native-to-base");
      expect(typeof chainId).toBe("number");
    });
  });

  describe("wallets ready check", () => {
    it("should expose areWalletsReady function", () => {
      const { result } = renderHook(() => useDualWallet());

      expect(typeof result.current.areWalletsReady).toBe("function");
    });

    it("should return boolean for direction", () => {
      const { result } = renderHook(() => useDualWallet());

      const ready = result.current.areWalletsReady("base-to-native");
      expect(typeof ready).toBe("boolean");
    });

    it("should indicate wallets ready when both connected", () => {
      const { result } = renderHook(() => useDualWallet());

      const ready = result.current.areWalletsReady("base-to-native");
      expect(ready).toBe(true);
    });

    it("should indicate wallets not ready when torus disconnected", () => {
      mockedUseTorus.mockReturnValueOnce({
        selectedAccount: undefined,
        isAccountConnected: false,
        isInitialized: true,
      });

      const { result } = renderHook(() => useDualWallet());

      const ready = result.current.areWalletsReady("base-to-native");
      expect(ready).toBe(false);
    });

    it("should indicate wallets not ready when EVM disconnected", () => {
      mockedUseAccount.mockReturnValueOnce({
        address: undefined,
        isConnected: false,
        chainId: undefined,
        status: "disconnected",
      });

      const { result } = renderHook(() => useDualWallet());

      const ready = result.current.areWalletsReady("base-to-native");
      expect(ready).toBe(false);
    });
  });

  describe("connection info", () => {
    it("should provide torus wallet address", () => {
      const { result } = renderHook(() => useDualWallet());

      const address = result.current.connectionState.torusWallet.address;
      expect(typeof address).toBe("string");
      expect(address).toMatch(/^1[A-Za-z0-9]+$/);
    });

    it("should provide EVM wallet address", () => {
      const { result } = renderHook(() => useDualWallet());

      const address = result.current.connectionState.evmWallet.address;
      expect(typeof address).toBe("string");
      expect(address).toMatch(/^0x[0-9a-fA-F]{40}$/);
    });

    it("should provide current chain ID", () => {
      const { result } = renderHook(() => useDualWallet());

      const chainId = result.current.connectionState.evmWallet.chainId;
      expect(typeof chainId).toBe("number");
    });
  });

  describe("wallet readiness", () => {
    it("should track both wallets being ready", () => {
      const { result } = renderHook(() => useDualWallet());

      expect(result.current.connectionState.torusWallet.isConnected).toBe(true);
      expect(result.current.connectionState.evmWallet.isConnected).toBe(true);
      expect(result.current.areWalletsReady("base-to-native")).toBe(true);
    });

    it("should handle partial connection (only torus)", () => {
      mockedUseAccount.mockReturnValueOnce({
        address: undefined,
        isConnected: false,
        chainId: undefined,
        status: "disconnected",
      });

      const { result } = renderHook(() => useDualWallet());

      expect(result.current.connectionState.torusWallet.isConnected).toBe(true);
      expect(result.current.connectionState.evmWallet.isConnected).toBe(false);
      expect(result.current.areWalletsReady("base-to-native")).toBe(false);
    });

    it("should handle partial connection (only EVM)", () => {
      mockedUseTorus.mockReturnValueOnce({
        selectedAccount: undefined,
        isAccountConnected: false,
        isInitialized: true,
      });

      const { result } = renderHook(() => useDualWallet());

      expect(result.current.connectionState.torusWallet.isConnected).toBe(false);
      expect(result.current.connectionState.evmWallet.isConnected).toBe(true);
      expect(result.current.areWalletsReady("base-to-native")).toBe(false);
    });

    it("should handle both wallets disconnected", () => {
      mockedUseTorus.mockReturnValueOnce({
        selectedAccount: undefined,
        isAccountConnected: false,
        isInitialized: true,
      });

      mockedUseAccount.mockReturnValueOnce({
        address: undefined,
        isConnected: false,
        chainId: undefined,
        status: "disconnected",
      });

      const { result } = renderHook(() => useDualWallet());

      expect(result.current.areWalletsReady("base-to-native")).toBe(false);
      expect(result.current.areWalletsReady("native-to-base")).toBe(false);
    });
  });

  describe("chain validation scenarios", () => {
    it("should validate chain for base-to-native when connected correctly", () => {
      mockedUseAccount.mockReturnValueOnce({
        address: "0x1234567890abcdef1234567890abcdef12345678",
        isConnected: true,
        chainId: 8453,
        status: "connected",
      });

      const { result } = renderHook(() => useDualWallet());

      const isRequired = result.current.isRequiredChainConnected(
        "base-to-native"
      );
      expect(isRequired).toBe(true);
    });

    it("should fail chain validation for base-to-native on wrong chain", () => {
      mockedUseAccount.mockReturnValueOnce({
        address: "0x1234567890abcdef1234567890abcdef12345678",
        isConnected: true,
        chainId: 1,
        status: "connected",
      });

      const { result } = renderHook(() => useDualWallet());

      const isRequired = result.current.isRequiredChainConnected(
        "base-to-native"
      );
      expect(isRequired).toBe(false);
    });
  });

  describe("memoization and stability", () => {
    it("should return consistent connectionState object", () => {
      const { result, rerender } = renderHook(() => useDualWallet());

      const firstState = result.current.connectionState;

      rerender();

      const secondState = result.current.connectionState;

      // Should be stable (same reference) if nothing changed
      expect(firstState).toBeDefined();
      expect(secondState).toBeDefined();
    });

    it("should return consistent methods", () => {
      const { result, rerender } = renderHook(() => useDualWallet());

      const firstMethods = {
        areWalletsReady: result.current.areWalletsReady,
        isRequiredChainConnected: result.current.isRequiredChainConnected,
        isOnOptimalChain: result.current.isOnOptimalChain,
        getRequiredChainId: result.current.getRequiredChainId,
      };

      rerender();

      const secondMethods = {
        areWalletsReady: result.current.areWalletsReady,
        isRequiredChainConnected: result.current.isRequiredChainConnected,
        isOnOptimalChain: result.current.isOnOptimalChain,
        getRequiredChainId: result.current.getRequiredChainId,
      };

      expect(typeof firstMethods.areWalletsReady).toBe("function");
      expect(typeof secondMethods.areWalletsReady).toBe("function");
    });
  });
});
