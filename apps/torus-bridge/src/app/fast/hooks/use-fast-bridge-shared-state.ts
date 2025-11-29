"use client";

import { useCallback, useState } from "react";
import type {
  SimpleBridgeState,
  SimpleBridgeTransaction,
} from "../_components/fast-bridge-types";
import { SimpleBridgeStep } from "../_components/fast-bridge-types";
import { getExplorerUrl } from "./fast-bridge-helpers";

export function useSimpleBridgeSharedState() {
  const [bridgeState, setBridgeState] = useState<SimpleBridgeState>({
    step: SimpleBridgeStep.IDLE,
    direction: null,
    amount: "",
  });

  const [transactions, setTransactions] = useState<SimpleBridgeTransaction[]>(
    [],
  );

  const updateBridgeState = useCallback(
    (updates: Partial<SimpleBridgeState>) => {
      setBridgeState((prev) => ({ ...prev, ...updates }));
    },
    [],
  );

  const addTransaction = useCallback((transaction: SimpleBridgeTransaction) => {
    setTransactions((prev) => {
      const existing = prev.find((tx) => tx.step === transaction.step);
      if (existing) {
        return prev.map((tx) =>
          tx.step === transaction.step ? transaction : tx,
        );
      }
      return [...prev, transaction];
    });
  }, []);

  const resetTransfer = useCallback(() => {
    setBridgeState({
      step: SimpleBridgeStep.IDLE,
      direction: null,
      amount: "",
    });
    setTransactions([]);
  }, []);

  const clearErrorDetails = useCallback(() => {
    setTransactions((prev) =>
      prev.map((tx) => ({
        ...tx,
        errorDetails: undefined,
      })),
    );
  }, []);

  return {
    bridgeState,
    transactions,
    updateBridgeState,
    addTransaction,
    setTransactions,
    resetTransfer,
    clearErrorDetails,
    getExplorerUrl,
  };
}
