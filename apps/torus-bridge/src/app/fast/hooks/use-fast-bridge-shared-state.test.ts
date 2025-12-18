import { renderHook, act } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SimpleBridgeStep } from "../_components/fast-bridge-types";
import { useSimpleBridgeSharedState } from "./use-fast-bridge-shared-state";

describe("useSimpleBridgeSharedState", () => {
  describe("initial state", () => {
    it("should initialize with IDLE state and empty direction/amount", () => {
      const { result } = renderHook(() => useSimpleBridgeSharedState());

      expect(result.current.bridgeState.step).toBe(SimpleBridgeStep.IDLE);
      expect(result.current.bridgeState.direction).toBeNull();
      expect(result.current.bridgeState.amount).toBe("");
      expect(result.current.transactions).toHaveLength(0);
    });
  });

  describe("updateBridgeState", () => {
    it("should update individual bridge state fields", () => {
      const { result } = renderHook(() => useSimpleBridgeSharedState());

      act(() => {
        result.current.updateBridgeState({
          step: SimpleBridgeStep.STEP_1_SIGNING,
          direction: "base-to-native",
          amount: "100",
        });
      });

      expect(result.current.bridgeState.step).toBe(SimpleBridgeStep.STEP_1_SIGNING);
      expect(result.current.bridgeState.direction).toBe("base-to-native");
      expect(result.current.bridgeState.amount).toBe("100");
    });

    it("should merge updates with existing state (not replace)", () => {
      const { result } = renderHook(() => useSimpleBridgeSharedState());

      act(() => {
        result.current.updateBridgeState({
          step: SimpleBridgeStep.STEP_1_SIGNING,
          direction: "base-to-native",
        });
      });

      expect(result.current.bridgeState.amount).toBe("");

      act(() => {
        result.current.updateBridgeState({ amount: "50" });
      });

      expect(result.current.bridgeState.step).toBe(SimpleBridgeStep.STEP_1_SIGNING);
      expect(result.current.bridgeState.direction).toBe("base-to-native");
      expect(result.current.bridgeState.amount).toBe("50");
    });

    it("should allow partial updates", () => {
      const { result } = renderHook(() => useSimpleBridgeSharedState());

      act(() => {
        result.current.updateBridgeState({
          step: SimpleBridgeStep.STEP_1_CONFIRMING,
        });
      });

      expect(result.current.bridgeState.step).toBe(SimpleBridgeStep.STEP_1_CONFIRMING);
      expect(result.current.bridgeState.direction).toBeNull();
      expect(result.current.bridgeState.amount).toBe("");
    });

    it("should allow clearing error details", () => {
      const { result } = renderHook(() => useSimpleBridgeSharedState());

      act(() => {
        result.current.updateBridgeState({
          errorDetails: "Some error occurred",
        });
      });

      expect(result.current.bridgeState.errorDetails).toBe("Some error occurred");

      act(() => {
        result.current.updateBridgeState({
          errorDetails: undefined,
        });
      });

      expect(result.current.bridgeState.errorDetails).toBeUndefined();
    });
  });

  describe("addTransaction", () => {
    it("should add a new transaction", () => {
      const { result } = renderHook(() => useSimpleBridgeSharedState());

      const mockTransaction = {
        step: SimpleBridgeStep.STEP_1,
        status: "CONFIRMING",
        txHash: "0x123",
      };

      act(() => {
        result.current.addTransaction(mockTransaction);
      });

      expect(result.current.transactions).toHaveLength(1);
      expect(result.current.transactions[0]).toEqual(mockTransaction);
    });

    it("should replace existing transaction for same step", () => {
      const { result } = renderHook(() => useSimpleBridgeSharedState());

      act(() => {
        result.current.addTransaction({
          step: SimpleBridgeStep.STEP_1,
          status: "CONFIRMING",
          txHash: "0x111",
        });
      });

      expect(result.current.transactions).toHaveLength(1);

      act(() => {
        result.current.addTransaction({
          step: SimpleBridgeStep.STEP_1,
          status: "CONFIRMED",
          txHash: "0x222",
        });
      });

      expect(result.current.transactions).toHaveLength(1);
      expect(result.current.transactions[0]?.txHash).toBe("0x222");
      expect(result.current.transactions[0]?.status).toBe("CONFIRMED");
    });

    it("should add multiple transactions for different steps", () => {
      const { result } = renderHook(() => useSimpleBridgeSharedState());

      act(() => {
        result.current.addTransaction({
          step: SimpleBridgeStep.STEP_1,
          status: "CONFIRMING",
          txHash: "0x111",
        });
        result.current.addTransaction({
          step: SimpleBridgeStep.STEP_2,
          status: "CONFIRMING",
          txHash: "0x222",
        });
      });

      expect(result.current.transactions).toHaveLength(2);
      expect(result.current.transactions[0]?.step).toBe(SimpleBridgeStep.STEP_1);
      expect(result.current.transactions[1]?.step).toBe(SimpleBridgeStep.STEP_2);
    });

    it("should not create duplicate transactions", () => {
      const { result } = renderHook(() => useSimpleBridgeSharedState());

      const transaction = {
        step: SimpleBridgeStep.STEP_1,
        status: "CONFIRMING",
        txHash: "0x123",
      };

      act(() => {
        result.current.addTransaction(transaction);
        result.current.addTransaction(transaction);
      });

      expect(result.current.transactions).toHaveLength(1);
    });
  });

  describe("resetTransfer", () => {
    it("should reset all state to initial values", () => {
      const { result } = renderHook(() => useSimpleBridgeSharedState());

      act(() => {
        result.current.updateBridgeState({
          step: SimpleBridgeStep.STEP_2_CONFIRMING,
          direction: "native-to-base",
          amount: "200",
          errorDetails: "Some error",
        });
        result.current.addTransaction({
          step: SimpleBridgeStep.STEP_1,
          status: "SUCCESS",
          txHash: "0x123",
        });
      });

      expect(result.current.bridgeState.step).toBe(SimpleBridgeStep.STEP_2_CONFIRMING);
      expect(result.current.transactions).toHaveLength(1);

      act(() => {
        result.current.resetTransfer();
      });

      expect(result.current.bridgeState.step).toBe(SimpleBridgeStep.IDLE);
      expect(result.current.bridgeState.direction).toBeNull();
      expect(result.current.bridgeState.amount).toBe("");
      expect(result.current.transactions).toHaveLength(0);
    });

    it("should be idempotent (safe to call multiple times)", () => {
      const { result } = renderHook(() => useSimpleBridgeSharedState());

      act(() => {
        result.current.updateBridgeState({ step: SimpleBridgeStep.STEP_1_SIGNING });
        result.current.resetTransfer();
        result.current.resetTransfer();
        result.current.resetTransfer();
      });

      expect(result.current.bridgeState.step).toBe(SimpleBridgeStep.IDLE);
      expect(result.current.transactions).toHaveLength(0);
    });
  });

  describe("clearErrorDetails", () => {
    it("should clear error details from all transactions", () => {
      const { result } = renderHook(() => useSimpleBridgeSharedState());

      act(() => {
        result.current.addTransaction({
          step: SimpleBridgeStep.STEP_1,
          status: "ERROR",
          txHash: "0x123",
          errorDetails: { message: "Step 1 failed", step: 1 },
        });
        result.current.addTransaction({
          step: SimpleBridgeStep.STEP_2,
          status: "ERROR",
          txHash: "0x456",
          errorDetails: { message: "Step 2 failed", step: 2 },
        });
      });

      expect(result.current.transactions[0]?.errorDetails).toBeDefined();
      expect(result.current.transactions[1]?.errorDetails).toBeDefined();

      act(() => {
        result.current.clearErrorDetails();
      });

      expect(result.current.transactions[0]?.errorDetails).toBeUndefined();
      expect(result.current.transactions[1]?.errorDetails).toBeUndefined();
      // Other fields should be preserved
      expect(result.current.transactions[0]?.status).toBe("ERROR");
      expect(result.current.transactions[0]?.txHash).toBe("0x123");
    });

    it("should not affect bridge state error details", () => {
      const { result } = renderHook(() => useSimpleBridgeSharedState());

      act(() => {
        result.current.updateBridgeState({
          errorDetails: "Bridge error",
        });
        result.current.addTransaction({
          step: SimpleBridgeStep.STEP_1,
          status: "ERROR",
          errorDetails: { message: "Transaction error", step: 1 },
        });
      });

      act(() => {
        result.current.clearErrorDetails();
      });

      // clearErrorDetails only clears transaction error details, not bridge state
      expect(result.current.transactions[0]?.errorDetails).toBeUndefined();
      expect(result.current.bridgeState.errorDetails).toBe("Bridge error");
    });

    it("should handle clearing when no error details exist", () => {
      const { result } = renderHook(() => useSimpleBridgeSharedState());

      act(() => {
        result.current.addTransaction({
          step: SimpleBridgeStep.STEP_1,
          status: "SUCCESS",
          txHash: "0x123",
        });
      });

      expect(() => {
        act(() => {
          result.current.clearErrorDetails();
        });
      }).not.toThrow();

      expect(result.current.transactions[0]?.status).toBe("SUCCESS");
    });
  });

  describe("setTransactions", () => {
    it("should allow directly setting transactions array", () => {
      const { result } = renderHook(() => useSimpleBridgeSharedState());

      const newTransactions = [
        { step: SimpleBridgeStep.STEP_1, status: "SUCCESS", txHash: "0x111" },
        { step: SimpleBridgeStep.STEP_2, status: "SUCCESS", txHash: "0x222" },
      ];

      act(() => {
        result.current.setTransactions(newTransactions);
      });

      expect(result.current.transactions).toEqual(newTransactions);
    });

    it("should allow replacing existing transactions", () => {
      const { result } = renderHook(() => useSimpleBridgeSharedState());

      act(() => {
        result.current.addTransaction({
          step: SimpleBridgeStep.STEP_1,
          status: "CONFIRMING",
          txHash: "0x123",
        });
      });

      expect(result.current.transactions).toHaveLength(1);

      const newTransactions = [
        { step: SimpleBridgeStep.STEP_1, status: "SUCCESS", txHash: "0x456" },
      ];

      act(() => {
        result.current.setTransactions(newTransactions);
      });

      expect(result.current.transactions).toHaveLength(1);
      expect(result.current.transactions[0]?.txHash).toBe("0x456");
    });
  });

  describe("getExplorerUrl", () => {
    it("should be available as helper function", () => {
      const { result } = renderHook(() => useSimpleBridgeSharedState());

      expect(typeof result.current.getExplorerUrl).toBe("function");
    });
  });

  describe("state synchronization", () => {
    it("should maintain state across multiple updates", () => {
      const { result } = renderHook(() => useSimpleBridgeSharedState());

      // Step 1: User selects direction and amount
      act(() => {
        result.current.updateBridgeState({
          direction: "base-to-native",
          amount: "100",
          step: SimpleBridgeStep.IDLE,
        });
      });

      // Step 2: User confirms transfer
      act(() => {
        result.current.updateBridgeState({
          step: SimpleBridgeStep.STEP_1_SIGNING,
        });
        result.current.addTransaction({
          step: SimpleBridgeStep.STEP_1,
          status: "SIGNING",
        });
      });

      // Step 3: Transfer confirms
      act(() => {
        result.current.updateBridgeState({
          step: SimpleBridgeStep.STEP_1_CONFIRMING,
        });
        result.current.addTransaction({
          step: SimpleBridgeStep.STEP_1,
          status: "CONFIRMING",
          txHash: "0x123",
        });
      });

      // Verify full state is consistent
      expect(result.current.bridgeState.direction).toBe("base-to-native");
      expect(result.current.bridgeState.amount).toBe("100");
      expect(result.current.bridgeState.step).toBe(SimpleBridgeStep.STEP_1_CONFIRMING);
      expect(result.current.transactions[0]?.txHash).toBe("0x123");
    });
  });
});
