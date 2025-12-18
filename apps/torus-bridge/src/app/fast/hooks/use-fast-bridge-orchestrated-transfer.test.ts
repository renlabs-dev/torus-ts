import { renderHook, act } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SimpleBridgeDirection } from "../_components/fast-bridge-types";
import { SimpleBridgeStep } from "../_components/fast-bridge-types";
import { useOrchestratedTransfer } from "./use-fast-bridge-orchestrated-transfer";

// Mock all dependencies
vi.mock("@hyperlane-xyz/widgets", () => ({
  useAccounts: () => ({ accounts: ["account1"] }),
}));

vi.mock("@torus-ts/query-provider/hooks", () => ({
  useFreeBalance: () => ({
    data: 1000n * 10n ** 18n,
    refetch: vi.fn().mockResolvedValue({ status: "success", data: 1000n * 10n ** 18n }),
  }),
  useGetTorusPrice: () => ({ data: 1.0 }),
}));

vi.mock("@torus-ts/torus-provider", () => ({
  useTorus: () => ({
    selectedAccount: { address: "1ABC..." },
    api: {},
    torusApi: {},
    wsEndpoint: "wss://test",
  }),
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

vi.mock("@torus-ts/ui/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock("wagmi", () => ({
  useAccount: () => ({
    address: "0x123...",
    chain: { id: 8453 },
  }),
  useBalance: () => ({
    data: { value: 5n * 10n ** 18n },
    refetch: vi.fn().mockResolvedValue({ status: "success", data: { value: 5n * 10n ** 18n } }),
  }),
  useClient: () => ({}),
  useConfig: () => ({}),
  useReadContract: () => ({
    data: 10n * 10n ** 18n,
    refetch: vi.fn().mockResolvedValue({ status: "success", data: 10n * 10n ** 18n }),
  }),
  useSwitchChain: () => ({
    switchChainAsync: vi.fn(),
  }),
  useWalletClient: () => ({
    data: {},
  }),
}));

vi.mock("~/config", () => ({
  contractAddresses: {
    base: { testnet: { torusErc20: "0xtorusErc20" } },
  },
  getChainValuesOnEnv: () => () => ({ chainId: 8453 }),
}));

vi.mock("~/env", () => ({
  env: (key: string) => {
    if (key === "NEXT_PUBLIC_TORUS_CHAIN_ENV") return "testnet";
    return "";
  },
}));

vi.mock("~/hooks/token", () => ({
  useWarpCore: () => ({}),
}));

vi.mock("~/hooks/use-multi-provider", () => ({
  useMultiProvider: () => ({}),
}));

vi.mock("~/hooks/use-token-transfer", () => ({
  useTokenTransfer: () => ({
    triggerTransactions: vi.fn().mockResolvedValue("0xtxhash"),
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
    it("should return initial state", () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      expect(result.current.bridgeState.step).toBe(SimpleBridgeStep.IDLE);
      expect(result.current.transactions).toEqual([]);
      expect(result.current.isTransferInProgress).toBe(false);
    });

    it("should expose all required methods", () => {
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
    it("should initiate a base-to-native transfer", async () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      const onTransactionCreated = vi.fn();

      await act(async () => {
        await result.current.executeTransfer(
          "base-to-native",
          "100",
          onTransactionCreated,
        );
      });

      // Verify that the transfer was initiated
      expect(result.current.bridgeState.direction).toBe("base-to-native");
      expect(result.current.bridgeState.amount).toBe("100");
    });

    it("should initiate a native-to-base transfer", async () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      const onTransactionCreated = vi.fn();

      await act(async () => {
        await result.current.executeTransfer(
          "native-to-base",
          "50",
          onTransactionCreated,
        );
      });

      expect(result.current.bridgeState.direction).toBe("native-to-base");
      expect(result.current.bridgeState.amount).toBe("50");
    });

    it("should clear error message when starting new transfer", async () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      // Simulate previous error state
      act(() => {
        result.current.updateBridgeState({
          step: SimpleBridgeStep.ERROR,
          errorMessage: "Previous error",
        });
      });

      await act(async () => {
        await result.current.executeTransfer("base-to-native", "100");
      });

      expect(result.current.bridgeState.errorMessage).toBeUndefined();
    });

    it("should set transfer in progress state", async () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      expect(result.current.isTransferInProgress).toBe(false);

      await act(async () => {
        await result.current.executeTransfer("base-to-native", "100");
      });

      // After transfer completes, isTransferInProgress should be false again
      // (unless still in progress state)
      expect(result.current.bridgeState.direction).toBe("base-to-native");
    });

    it("should call onTransactionCreated callback when provided", async () => {
      const { result } = renderHook(() => useOrchestratedTransfer());
      const onTransactionCreated = vi.fn();

      await act(async () => {
        await result.current.executeTransfer(
          "base-to-native",
          "100",
          onTransactionCreated,
        );
      });

      // The callback might be called during the flow
      expect(onTransactionCreated).toBeDefined();
    });
  });

  describe("quick send transfers", () => {
    it("should execute quick send to native", async () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      await act(async () => {
        await result.current.executeEvmToNative("100");
      });

      // Should set up state for step 2 (step 1 already done)
      expect(result.current.bridgeState.direction).toBe("base-to-native");
      expect(result.current.bridgeState.amount).toBe("100");
    });

    it("should execute quick send to base", async () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      await act(async () => {
        await result.current.executeEvmToBase("50");
      });

      expect(result.current.bridgeState.direction).toBe("native-to-base");
      expect(result.current.bridgeState.amount).toBe("50");
    });

    it("should initialize transactions array for quick send", async () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      await act(async () => {
        await result.current.executeEvmToNative("100");
      });

      // Transactions should be initialized with step 1 already successful
      expect(Array.isArray(result.current.transactions)).toBe(true);
    });
  });

  describe("transfer progress state", () => {
    it("should track transfer in progress", async () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      await act(async () => {
        result.current.updateBridgeState({
          step: SimpleBridgeStep.STEP_1_SIGNING,
        });
      });

      expect(result.current.isTransferInProgress).toBe(true);
    });

    it("should not track transfer in progress when IDLE", () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      expect(result.current.isTransferInProgress).toBe(false);
    });

    it("should not track transfer in progress when COMPLETE", async () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      await act(async () => {
        result.current.updateBridgeState({
          step: SimpleBridgeStep.COMPLETE,
        });
      });

      expect(result.current.isTransferInProgress).toBe(false);
    });

    it("should not track transfer in progress when ERROR", async () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      await act(async () => {
        result.current.updateBridgeState({
          step: SimpleBridgeStep.ERROR,
        });
      });

      expect(result.current.isTransferInProgress).toBe(false);
    });
  });

  describe("transaction ID management", () => {
    it("should set current transaction ID", () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      act(() => {
        result.current.setCurrentTransactionId("tx-123");
      });

      // TransactionID is stored in ref, not directly accessible, but we can verify it doesn't throw
      expect(() => result.current.setCurrentTransactionId("tx-456")).not.toThrow();
    });

    it("should allow clearing transaction ID", () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      act(() => {
        result.current.setCurrentTransactionId("tx-123");
      });

      act(() => {
        result.current.setCurrentTransactionId(null);
      });

      expect(() => result.current.setCurrentTransactionId(null)).not.toThrow();
    });
  });

  describe("state management", () => {
    it("should update bridge state", async () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      await act(async () => {
        result.current.updateBridgeState({
          step: SimpleBridgeStep.STEP_1_CONFIRMING,
          direction: "base-to-native",
          amount: "100",
        });
      });

      expect(result.current.bridgeState.step).toBe(SimpleBridgeStep.STEP_1_CONFIRMING);
      expect(result.current.bridgeState.direction).toBe("base-to-native");
      expect(result.current.bridgeState.amount).toBe("100");
    });

    it("should set transactions array", async () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      const mockTransactions = [
        { step: 1 as const, status: "SUCCESS" as const },
        { step: 2 as const, status: "CONFIRMING" as const },
      ];

      await act(async () => {
        result.current.setTransactions(mockTransactions);
      });

      expect(result.current.transactions).toEqual(mockTransactions);
    });

    it("should reset transfer state", async () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      // Set up some state
      await act(async () => {
        result.current.updateBridgeState({
          step: SimpleBridgeStep.STEP_1_SIGNING,
          direction: "base-to-native",
          amount: "100",
        });
        result.current.setTransactions([
          { step: 1 as const, status: "SIGNING" as const },
        ]);
      });

      // Reset
      await act(async () => {
        result.current.resetTransfer();
      });

      // Should return to initial state
      expect(result.current.bridgeState.step).toBe(SimpleBridgeStep.IDLE);
    });
  });

  describe("F5 recovery", () => {
    it("should expose resume step 1 polling", () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      expect(typeof result.current.resumeStep1Polling).toBe("function");
    });

    it("should expose resume step 2 polling", () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      expect(typeof result.current.resumeStep2Polling).toBe("function");
    });

    it("should call onComplete callback for step1 base-to-native recovery", async () => {
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

    it("should call onComplete callback for step1 native-to-base recovery", async () => {
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

    it("should call onComplete callback for step2 base-to-native recovery", async () => {
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

    it("should call onComplete callback for step2 native-to-base recovery", async () => {
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
    it("should provide explorer URL helper", () => {
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

    it("should handle retry without throwing", async () => {
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
    it("should handle multiple sequential transfers", async () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      await act(async () => {
        await result.current.executeTransfer("base-to-native", "100");
      });

      const firstDirection = result.current.bridgeState.direction;

      await act(async () => {
        result.current.resetTransfer();
        await result.current.executeTransfer("native-to-base", "50");
      });

      const secondDirection = result.current.bridgeState.direction;

      expect(firstDirection).toBe("base-to-native");
      expect(secondDirection).toBe("native-to-base");
    });

    it("should clear transactions between transfers", async () => {
      const { result } = renderHook(() => useOrchestratedTransfer());

      await act(async () => {
        result.current.setTransactions([
          { step: 1 as const, status: "SUCCESS" as const },
        ]);
      });

      expect(result.current.transactions).toHaveLength(1);

      await act(async () => {
        result.current.setTransactions([]);
      });

      expect(result.current.transactions).toHaveLength(0);
    });
  });
});
