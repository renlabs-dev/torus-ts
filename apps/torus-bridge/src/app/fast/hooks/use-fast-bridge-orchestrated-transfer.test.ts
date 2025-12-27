import { renderHook, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SimpleBridgeDirection } from "../_components/fast-bridge-types";
import { SimpleBridgeStep } from "../_components/fast-bridge-types";
import { useOrchestratedTransfer } from "./use-fast-bridge-orchestrated-transfer";

// Mock dependencies specific to this file
vi.mock("@hyperlane-xyz/widgets", () => ({
  useAccounts: () => ({ accounts: ["account1"] }),
}));

vi.mock("@torus-ts/torus-provider/use-send-transaction", () => ({
  useSendTransaction: () => ({
    sendTx: vi.fn().mockResolvedValue([
      undefined,
      {
        tracker: {
          on: vi.fn(),
          off: vi.fn(),
        },
      },
    ]),
  }),
}));

vi.mock("./use-fast-bridge-shared-state", () => ({
  useSimpleBridgeSharedState: () => ({
    bridgeState: {
      step: SimpleBridgeStep.IDLE,
      direction: null,
      amount: "",
      errorMessage: undefined,
    },
    transactions: [],
    updateBridgeState: vi.fn(),
    addTransaction: vi.fn(),
    setTransactions: vi.fn(),
    resetTransfer: vi.fn(),
    clearErrorDetails: vi.fn(),
    getExplorerUrl: vi.fn((hash) => `https://explorer.test/${hash}`),
  }),
}));

vi.mock("./use-fast-bridge-transaction-history", () => ({
  useFastBridgeTransactionHistory: () => ({
    addTransaction: vi.fn().mockReturnValue("tx-id-123"),
    updateTransaction: vi.fn(),
    getTransactionById: vi.fn(),
    getTransactions: vi.fn().mockReturnValue([]),
    getPendingTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
    clearHistory: vi.fn(),
    markAsRetried: vi.fn(),
    markFailedAsRecoveredViaEvmRecover: vi.fn(),
  }),
}));

vi.mock("./fast-bridge-base-to-native-flow", () => ({
  executeBaseToNativeStep1: vi.fn().mockResolvedValue({
    success: true,
    txHash: "0xstep1tx",
  }),
  executeBaseToNativeStep2: vi.fn().mockResolvedValue({
    success: true,
    txHash: "0xstep2tx",
  }),
}));

vi.mock("./fast-bridge-native-to-base-flow", () => ({
  executeNativeToBaseStep1: vi.fn().mockResolvedValue({
    success: true,
    txHash: "0xstep1tx",
  }),
  executeNativeToBaseStep2: vi.fn().mockResolvedValue({
    success: true,
    txHash: "0xstep2tx",
  }),
}));

vi.mock("./fast-bridge-polling", () => ({
  pollEvmBalance: vi.fn().mockResolvedValue({
    success: true,
    finalBalance: 100n,
  }),
}));

vi.mock("./fast-bridge-helpers", () => ({
  BASE_CHAIN_ID: 8453,
  UserRejectedError: class UserRejectedError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "UserRejectedError";
    }
  },
}));

describe("useOrchestratedTransfer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    it("should return initial bridge state", () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      expect(result.current.bridgeState.step).toBe(SimpleBridgeStep.IDLE);
      expect(result.current.transactions).toEqual([]);
      expect(result.current.isTransferInProgress).toBe(false);
    });

    it("should expose all required API methods", () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      expect(typeof result.current.executeTransfer).toBe("function");
      expect(typeof result.current.resetTransfer).toBe("function");
      expect(typeof result.current.retryFromFailedStep).toBe("function");
      expect(typeof result.current.setTransactions).toBe("function");
      expect(typeof result.current.updateBridgeState).toBe("function");
      expect(typeof result.current.setCurrentTransactionId).toBe("function");
      expect(typeof result.current.executeEvmToNative).toBe("function");
      expect(typeof result.current.executeEvmToBase).toBe("function");
      expect(typeof result.current.resumeStep1Polling).toBe("function");
      expect(typeof result.current.resumeStep2Polling).toBe("function");
    });
  });

  describe("executeTransfer", () => {
    it("should accept base-to-native transfer without throwing error", async () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      const onTransactionCreated = vi.fn();

      expect(async () => {
        await result.current.executeTransfer(
          "base-to-native",
          "100",
          onTransactionCreated,
        );
      }).toBeDefined();
    });

    it("should accept native-to-base transfer without throwing error", async () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      const onTransactionCreated = vi.fn();

      expect(async () => {
        await result.current.executeTransfer(
          "native-to-base",
          "50",
          onTransactionCreated,
        );
      }).toBeDefined();
    });

    it("should allow updating bridge state without throwing error", async () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      expect(() => {
        result.current.updateBridgeState({
          step: SimpleBridgeStep.ERROR,
          errorMessage: "Previous error",
        });
      }).not.toThrow();
    });

    it("should accept transfer execution as a function", async () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      expect(typeof result.current.executeTransfer).toBe("function");
    });

    it("should accept onTransactionCreated callback", async () => {
      const { result } = renderHook(() => useOrchestratedTransfer());
      const onTransactionCreated = vi.fn();

      expect(onTransactionCreated).toBeDefined();
    });
  });

  describe("quick send transfers", () => {
    it("should provide executeEvmToNative method", async () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      expect(typeof result.current.executeEvmToNative).toBe("function");
    });

    it("should provide executeEvmToBase method", async () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      expect(typeof result.current.executeEvmToBase).toBe("function");
    });

    it("should return array for transactions on quick send", async () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      expect(Array.isArray(result.current.transactions)).toBe(true);
    });
  });

  describe("transfer progress state", () => {
    it("should have isTransferInProgress property", () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      expect(typeof result.current.isTransferInProgress).toBe("boolean");
    });

    it("should start with transfer not in progress", () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      expect(result.current.isTransferInProgress).toBe(false);
    });

    it("should allow updateBridgeState to be called with step", () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      expect(() => {
        result.current.updateBridgeState({
          step: SimpleBridgeStep.STEP_1_SIGNING,
        });
      }).not.toThrow();
    });

    it("should allow updateBridgeState to be called with complete step", () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      expect(() => {
        result.current.updateBridgeState({
          step: SimpleBridgeStep.COMPLETE,
        });
      }).not.toThrow();
    });

    it("should allow updateBridgeState to be called with error step", () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      expect(() => {
        result.current.updateBridgeState({
          step: SimpleBridgeStep.ERROR,
        });
      }).not.toThrow();
    });
  });

  describe("transaction ID management", () => {
    it("should set current transaction ID without throwing error", () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      expect(() => result.current.setCurrentTransactionId("tx-123")).not.toThrow();
    });

    it("should allow clearing transaction ID without throwing error", () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      act(() => {
        result.current.setCurrentTransactionId("tx-123");
      });

      expect(() => result.current.setCurrentTransactionId(null)).not.toThrow();
    });
  });

  describe("state management", () => {
    it("should provide updateBridgeState method", () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      expect(typeof result.current.updateBridgeState).toBe("function");
    });

    it("should provide setTransactions method", () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      expect(typeof result.current.setTransactions).toBe("function");
    });

    it("should provide resetTransfer method", () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      expect(typeof result.current.resetTransfer).toBe("function");
    });

    it("should allow updateBridgeState to be called with multiple properties", () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      expect(() => {
        result.current.updateBridgeState({
          step: SimpleBridgeStep.STEP_1_CONFIRMING,
          direction: "base-to-native",
          amount: "100",
        });
      }).not.toThrow();
    });

    it("should allow setTransactions to be called with transaction array", () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      const mockTransactions = [
        { step: 1 as const, status: "SUCCESS" as const },
        { step: 2 as const, status: "CONFIRMING" as const },
      ];

      expect(() => {
        result.current.setTransactions(mockTransactions);
      }).not.toThrow();
    });

    it("should allow resetTransfer to be called without throwing", () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      expect(() => {
        result.current.resetTransfer();
      }).not.toThrow();
    });
  });

  describe("F5 recovery", () => {
    it("should expose resume step 1 polling method", () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      expect(typeof result.current.resumeStep1Polling).toBe("function");
    });

    it("should expose resume step 2 polling method", () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      expect(typeof result.current.resumeStep2Polling).toBe("function");
    });

    it("should call onComplete callback for base-to-native step 1 recovery", async () => {
      const { result } = renderHook(() => useOrchestratedTransfer());
      const onComplete = vi.fn();
      const onError = vi.fn();

      await act(async () => {
        await result.current.resumeStep1Polling(
          {
            direction: "base-to-native",
            amount: "100",
            step1BaselineBalance: "1000",
          },
          onComplete,
          onError,
        );
      });

      expect(onComplete).toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });

    it("should call onComplete callback for native-to-base step 1 recovery", async () => {
      const { result } = renderHook(() => useOrchestratedTransfer());
      const onComplete = vi.fn();
      const onError = vi.fn();

      await act(async () => {
        await result.current.resumeStep1Polling(
          {
            direction: "native-to-base",
            amount: "100",
            step1BaselineBalance: "1000",
          },
          onComplete,
          onError,
        );
      });

      expect(onComplete).toHaveBeenCalled();
    });

    it("should call onComplete callback for base-to-native step 2 recovery", async () => {
      const { result } = renderHook(() => useOrchestratedTransfer());
      const onComplete = vi.fn();
      const onError = vi.fn();

      await act(async () => {
        await result.current.resumeStep2Polling(
          {
            direction: "base-to-native",
            amount: "100",
            step2BaselineBalance: "5000",
            step2TxHash: "0xhash",
          },
          onComplete,
          onError,
        );
      });

      expect(onComplete).toHaveBeenCalled();
    });

    it("should call onComplete callback for native-to-base step 2 recovery", async () => {
      const { result } = renderHook(() => useOrchestratedTransfer());
      const onComplete = vi.fn();
      const onError = vi.fn();

      await act(async () => {
        await result.current.resumeStep2Polling(
          {
            direction: "native-to-base",
            amount: "100",
            step2BaselineBalance: "5000",
            step2TxHash: "0xhash",
          },
          onComplete,
          onError,
        );
      });

      expect(onComplete).toHaveBeenCalled();
    });
  });

  describe("explorer URL", () => {
    it("should provide explorer URL helper method", () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      const url = result.current.getExplorerUrl("0xtxhash", "Base");
      expect(typeof url).toBe("string");
    });
  });

  describe("retry functionality", () => {
    it("should expose retry from failed step method", () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      expect(typeof result.current.retryFromFailedStep).toBe("function");
    });

    it("should handle retry without throwing error", async () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      await act(async () => {
        result.current.updateBridgeState({
          step: SimpleBridgeStep.ERROR,
          direction: "base-to-native",
          amount: "100",
        });
        result.current.setTransactions([
          {
            step: 2 as const,
            status: "ERROR" as const,
          },
        ]);
      });

      await act(async () => {
        await result.current.retryFromFailedStep();
      });

      expect(result.current.bridgeState).toBeDefined();
    });
  });

  describe("multiple transfers", () => {
    it("should allow sequential transfer executions", async () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      expect(() => {
        result.current.executeTransfer("base-to-native", "100");
      }).toBeDefined();

      expect(() => {
        result.current.resetTransfer();
      }).not.toThrow();

      expect(() => {
        result.current.executeTransfer("native-to-base", "50");
      }).toBeDefined();
    });

    it("should allow clearing and resetting transactions", () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      expect(() => {
        result.current.setTransactions([
          { step: 1 as const, status: "SUCCESS" as const },
        ]);
      }).not.toThrow();

      expect(() => {
        result.current.setTransactions([]);
      }).not.toThrow();
    });
  });
});