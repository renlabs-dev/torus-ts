import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useFastBridgeTransactionHistory } from "./use-fast-bridge-transaction-history";

describe("useFastBridgeTransactionHistory - Zustand Store", () => {
  beforeEach(() => {
    // Clear localStorage and reset the store state before each test
    const { result } = renderHook(() => useFastBridgeTransactionHistory());
    act(() => {
      result.current.clearHistory();
    });
  });

  describe("adding transactions", () => {
    it("should add a transaction and return a unique ID", () => {
      const { result } = renderHook(() => useFastBridgeTransactionHistory());

      let transactionId: string;
      act(() => {
        transactionId = result.current.addTransaction({
          direction: "base-to-native",
          amount: "100",
          status: "completed",
          step1TxHash: "0x1234567890abcdef",
          step2TxHash: "0xfedcba0987654321",
          baseAddress: "0xbase",
          nativeAddress: "native123",
        });
      });

      const transaction = result.current.getTransactionById(transactionId!);
      expect(transaction).toBeDefined();
      expect(transaction?.id).toBe(transactionId);
      expect(transaction?.timestamp).toBeDefined();
    });

    it("should add transaction with all properties", () => {
      const { result } = renderHook(() => useFastBridgeTransactionHistory());

      let transactionId: string;
      act(() => {
        transactionId = result.current.addTransaction({
          direction: "base-to-native",
          amount: "100",
          status: "completed",
          step1TxHash: "0x1234567890abcdef",
          step2TxHash: "0xfedcba0987654321",
          baseAddress: "0xbase",
          nativeAddress: "native123",
          recoveredViaEvmRecover: false,
          canRetry: false,
        });
      });

      const transaction = result.current.getTransactionById(transactionId!);
      expect(transaction?.direction).toBe("base-to-native");
      expect(transaction?.amount).toBe("100");
      expect(transaction?.status).toBe("completed");
      expect(transaction?.step1TxHash).toBe("0x1234567890abcdef");
      expect(transaction?.step2TxHash).toBe("0xfedcba0987654321");
      expect(transaction?.baseAddress).toBe("0xbase");
      expect(transaction?.nativeAddress).toBe("native123");
    });

    it("should add multiple transactions", () => {
      const { result } = renderHook(() => useFastBridgeTransactionHistory());

      let id1: string, id2: string, id3: string;
      act(() => {
        id1 = result.current.addTransaction({
          direction: "base-to-native",
          amount: "100",
          status: "completed",
        });
        id2 = result.current.addTransaction({
          direction: "native-to-base",
          amount: "200",
          status: "pending",
        });
        id3 = result.current.addTransaction({
          direction: "base-to-native",
          amount: "300",
          status: "error",
        });
      });

      expect(result.current.transactions).toHaveLength(3);
      expect(result.current.getTransactionById(id1!)).toBeDefined();
      expect(result.current.getTransactionById(id2!)).toBeDefined();
      expect(result.current.getTransactionById(id3!)).toBeDefined();
    });

    it("should prepend new transactions to the list", () => {
      const { result } = renderHook(() => useFastBridgeTransactionHistory());

      let id1: string, id2: string;
      act(() => {
        id1 = result.current.addTransaction({
          direction: "base-to-native",
          amount: "100",
          status: "completed",
        });
        id2 = result.current.addTransaction({
          direction: "native-to-base",
          amount: "200",
          status: "pending",
        });
      });

      // Most recent transaction should be first
      expect(result.current.transactions[0]?.id).toBe(id2);
      expect(result.current.transactions[1]?.id).toBe(id1);
    });

    it("should generate unique IDs for multiple transactions", () => {
      const { result } = renderHook(() => useFastBridgeTransactionHistory());

      const ids: string[] = [];
      act(() => {
        for (let i = 0; i < 5; i++) {
          ids.push(
            result.current.addTransaction({
              direction: "base-to-native",
              amount: "100",
              status: "completed",
            })
          );
        }
      });

      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(5);
    });
  });

  describe("updating transactions", () => {
    it("should update a transaction's properties", () => {
      const { result } = renderHook(() => useFastBridgeTransactionHistory());

      let transactionId: string;
      act(() => {
        transactionId = result.current.addTransaction({
          direction: "base-to-native",
          amount: "50",
          status: "pending",
        });
      });

      act(() => {
        result.current.updateTransaction(transactionId!, {
          status: "completed",
          step1TxHash: "0xupdatedhash1",
          step2TxHash: "0xupdatedhash2",
        });
      });

      const transaction = result.current.getTransactionById(transactionId!);
      expect(transaction?.status).toBe("completed");
      expect(transaction?.step1TxHash).toBe("0xupdatedhash1");
      expect(transaction?.step2TxHash).toBe("0xupdatedhash2");
    });

    it("should update error details", () => {
      const { result } = renderHook(() => useFastBridgeTransactionHistory());

      let transactionId: string;
      act(() => {
        transactionId = result.current.addTransaction({
          direction: "base-to-native",
          amount: "100",
          status: "error",
        });
      });

      act(() => {
        result.current.updateTransaction(transactionId!, {
          errorMessage: "Bridge failed",
          errorStep: 2,
        });
      });

      const transaction = result.current.getTransactionById(transactionId!);
      expect(transaction?.errorMessage).toBe("Bridge failed");
      expect(transaction?.errorStep).toBe(2);
    });

    it("should not affect other transactions when updating one", () => {
      const { result } = renderHook(() => useFastBridgeTransactionHistory());

      let id1: string, id2: string;
      act(() => {
        id1 = result.current.addTransaction({
          direction: "base-to-native",
          amount: "100",
          status: "completed",
        });
        id2 = result.current.addTransaction({
          direction: "native-to-base",
          amount: "200",
          status: "pending",
        });
      });

      act(() => {
        result.current.updateTransaction(id1!, { amount: "150" });
      });

      expect(result.current.getTransactionById(id1!)?.amount).toBe("150");
      expect(result.current.getTransactionById(id2!)?.amount).toBe("200");
    });
  });

  describe("retrieving transactions", () => {
    it("should get transactions sorted by timestamp (newest first)", () => {
      const { result } = renderHook(() => useFastBridgeTransactionHistory());

      const ids: string[] = [];
      act(() => {
        ids.push(
          result.current.addTransaction({
            direction: "base-to-native",
            amount: "100",
            status: "completed",
          })
        );
      });

      // Wait a bit to ensure different timestamps
      act(() => {
        ids.push(
          result.current.addTransaction({
            direction: "native-to-base",
            amount: "200",
            status: "pending",
          })
        );
      });

      const sorted = result.current.getTransactions();
      expect(sorted[0]?.id).toBe(ids[1]);
      expect(sorted[1]?.id).toBe(ids[0]);
    });

    it("should get transaction by ID", () => {
      const { result } = renderHook(() => useFastBridgeTransactionHistory());

      let transactionId: string;
      act(() => {
        transactionId = result.current.addTransaction({
          direction: "base-to-native",
          amount: "100",
          status: "completed",
        });
      });

      const transaction = result.current.getTransactionById(transactionId!);
      expect(transaction?.id).toBe(transactionId);
    });

    it("should return undefined for non-existent transaction ID", () => {
      const { result } = renderHook(() => useFastBridgeTransactionHistory());

      const transaction = result.current.getTransactionById("non-existent-id");
      expect(transaction).toBeUndefined();
    });

    it("should get pending transaction (pending status)", () => {
      const { result } = renderHook(() => useFastBridgeTransactionHistory());

      let pendingId: string;
      act(() => {
        result.current.addTransaction({
          direction: "base-to-native",
          amount: "100",
          status: "completed",
        });
        pendingId = result.current.addTransaction({
          direction: "native-to-base",
          amount: "200",
          status: "pending",
        });
        result.current.addTransaction({
          direction: "base-to-native",
          amount: "300",
          status: "error",
        });
      });

      const pending = result.current.getPendingTransaction();
      expect(pending?.id).toBe(pendingId);
      expect(pending?.status).toBe("pending");
    });

    it("should get pending transaction (step1_complete status)", () => {
      const { result } = renderHook(() => useFastBridgeTransactionHistory());

      let step1Id: string;
      act(() => {
        result.current.addTransaction({
          direction: "base-to-native",
          amount: "100",
          status: "completed",
        });
        step1Id = result.current.addTransaction({
          direction: "native-to-base",
          amount: "200",
          status: "step1_complete",
        });
        result.current.addTransaction({
          direction: "base-to-native",
          amount: "300",
          status: "error",
        });
      });

      const pending = result.current.getPendingTransaction();
      expect(pending?.id).toBe(step1Id);
      expect(pending?.status).toBe("step1_complete");
    });

    it("should return undefined when no pending transaction exists", () => {
      const { result } = renderHook(() => useFastBridgeTransactionHistory());

      act(() => {
        result.current.addTransaction({
          direction: "base-to-native",
          amount: "100",
          status: "completed",
        });
        result.current.addTransaction({
          direction: "base-to-native",
          amount: "300",
          status: "error",
        });
      });

      const pending = result.current.getPendingTransaction();
      expect(pending).toBeUndefined();
    });
  });

  describe("deleting transactions", () => {
    it("should delete a transaction by ID", () => {
      const { result } = renderHook(() => useFastBridgeTransactionHistory());

      let transactionId: string;
      act(() => {
        transactionId = result.current.addTransaction({
          direction: "base-to-native",
          amount: "100",
          status: "completed",
        });
      });

      expect(result.current.getTransactionById(transactionId!)).toBeDefined();

      act(() => {
        result.current.deleteTransaction(transactionId!);
      });

      expect(result.current.getTransactionById(transactionId!)).toBeUndefined();
      expect(result.current.transactions).toHaveLength(0);
    });

    it("should only delete specified transaction", () => {
      const { result } = renderHook(() => useFastBridgeTransactionHistory());

      let id1: string, id2: string;
      act(() => {
        id1 = result.current.addTransaction({
          direction: "base-to-native",
          amount: "100",
          status: "completed",
        });
        id2 = result.current.addTransaction({
          direction: "native-to-base",
          amount: "200",
          status: "pending",
        });
      });

      act(() => {
        result.current.deleteTransaction(id1!);
      });

      expect(result.current.transactions).toHaveLength(1);
      expect(result.current.getTransactionById(id1!)).toBeUndefined();
      expect(result.current.getTransactionById(id2!)).toBeDefined();
    });

    it("should clear all transactions", () => {
      const { result } = renderHook(() => useFastBridgeTransactionHistory());

      act(() => {
        result.current.addTransaction({
          direction: "base-to-native",
          amount: "100",
          status: "completed",
        });
        result.current.addTransaction({
          direction: "native-to-base",
          amount: "200",
          status: "pending",
        });
        result.current.addTransaction({
          direction: "base-to-native",
          amount: "300",
          status: "error",
        });
      });

      expect(result.current.transactions).toHaveLength(3);

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.transactions).toHaveLength(0);
    });
  });

  describe("transaction status updates", () => {
    it("should mark transaction as retried", () => {
      const { result } = renderHook(() => useFastBridgeTransactionHistory());

      let transactionId: string;
      act(() => {
        transactionId = result.current.addTransaction({
          direction: "base-to-native",
          amount: "100",
          status: "error",
          canRetry: true,
        });
      });

      act(() => {
        result.current.markAsRetried(transactionId!);
      });

      const transaction = result.current.getTransactionById(transactionId!);
      expect(transaction?.status).toBe("pending");
      expect(transaction?.canRetry).toBe(false);
    });

    it("should mark all failed transactions as recovered via EVM recover", () => {
      const { result } = renderHook(() => useFastBridgeTransactionHistory());

      let errorId1: string, errorId2: string, completedId: string;
      act(() => {
        completedId = result.current.addTransaction({
          direction: "base-to-native",
          amount: "100",
          status: "completed",
        });
        errorId1 = result.current.addTransaction({
          direction: "native-to-base",
          amount: "200",
          status: "error",
          errorMessage: "Failed",
          errorStep: 1,
        });
        errorId2 = result.current.addTransaction({
          direction: "base-to-native",
          amount: "300",
          status: "error",
          errorMessage: "Failed",
          errorStep: 2,
        });
      });

      act(() => {
        result.current.markFailedAsRecoveredViaEvmRecover();
      });

      const tx1 = result.current.getTransactionById(errorId1!);
      const tx2 = result.current.getTransactionById(errorId2!);
      const completedTx = result.current.getTransactionById(completedId!);

      expect(tx1?.status).toBe("completed");
      expect(tx1?.recoveredViaEvmRecover).toBe(true);
      expect(tx1?.canRetry).toBe(false);
      expect(tx1?.errorMessage).toBeUndefined();
      expect(tx1?.errorStep).toBeUndefined();

      expect(tx2?.status).toBe("completed");
      expect(tx2?.recoveredViaEvmRecover).toBe(true);

      // Completed transaction should not be affected
      expect(completedTx?.status).toBe("completed");
      expect(completedTx?.recoveredViaEvmRecover).toBe(false);
    });
  });

  describe("store persistence", () => {
    it("should maintain store state across multiple renders", () => {
      const { result, rerender } = renderHook(() => useFastBridgeTransactionHistory());

      let transactionId: string;
      act(() => {
        transactionId = result.current.addTransaction({
          direction: "base-to-native",
          amount: "100",
          status: "completed",
        });
      });

      expect(result.current.transactions).toHaveLength(1);

      rerender();

      expect(result.current.transactions).toHaveLength(1);
      expect(result.current.getTransactionById(transactionId!)).toBeDefined();
    });
  });
});
