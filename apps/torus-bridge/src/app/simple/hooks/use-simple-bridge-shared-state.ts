"use client";

import { useCallback, useState } from "react";
import type {
  SimpleBridgeState,
  SimpleBridgeTransaction,
} from "../_components/simple-bridge-types";
import { SimpleBridgeStep } from "../_components/simple-bridge-types";
import { getExplorerUrl } from "./simple-bridge-helpers";

/**
 * Manages local state and transaction list for the simple bridge flow.
 *
 * Exposes the current bridge state and transactions plus stable handlers to update state, add or replace a transaction by step, directly set transactions, reset the transfer to its initial state, clear per-transaction error details, and access an explorer URL helper.
 *
 * @returns An object containing:
 * - `bridgeState`: the current SimpleBridgeState with `step`, `direction`, and `amount`.
 * - `transactions`: an array of current SimpleBridgeTransaction items.
 * - `updateBridgeState`: a callback to merge partial updates into `bridgeState`.
 * - `addTransaction`: a callback that upserts a transaction by its `step` (replaces existing step or appends).
 * - `setTransactions`: direct state setter for the `transactions` array.
 * - `resetTransfer`: a callback that resets `bridgeState` to initial values and clears `transactions`.
 * - `clearErrorDetails`: a callback that removes `errorDetails` from every transaction.
 * - `getExplorerUrl`: helper function to build explorer URLs (imported from helpers).
 */
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