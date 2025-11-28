"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FastBridgeTransactionHistoryItem } from "../_components/fast-bridge-types";

interface FastBridgeTransactionHistoryState {
  transactions: FastBridgeTransactionHistoryItem[];
  addTransaction: (
    transaction: Omit<FastBridgeTransactionHistoryItem, "id" | "timestamp">,
  ) => string;
  updateTransaction: (
    id: string,
    updates: Partial<FastBridgeTransactionHistoryItem>,
  ) => void;
  getTransactions: () => FastBridgeTransactionHistoryItem[];
  getTransactionById: (
    id: string,
  ) => FastBridgeTransactionHistoryItem | undefined;
  clearHistory: () => void;
  deleteTransaction: (id: string) => void;
  markAsRetried: (id: string) => void;
  markFailedAsRecoveredViaEvmRecover: () => void;
}

function generateId(): string {
  // Use crypto.randomUUID() if available for better uniqueness
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  // Fallback for older environments
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export const useFastBridgeTransactionHistory =
  create<FastBridgeTransactionHistoryState>()(
    persist(
      (set, get) => ({
        transactions: [],

        addTransaction: (transaction) => {
          const id = generateId();
          const newTransaction: FastBridgeTransactionHistoryItem = {
            ...transaction,
            id,
            timestamp: Date.now(),
          };

          set((state) => ({
            transactions: [newTransaction, ...state.transactions],
          }));

          return id;
        },

        updateTransaction: (id, updates) => {
          // If updating to "completed" status and NOT recovered via EVM Recover,
          // delete the transaction instead of updating
          if (updates.status === "completed" && !updates.recoveredViaEvmRecover) {
            set((state) => ({
              transactions: state.transactions.filter((tx) => tx.id !== id),
            }));
            return;
          }

          set((state) => ({
            transactions: state.transactions.map((tx) =>
              tx.id === id ? { ...tx, ...updates } : tx,
            ),
          }));
        },

        getTransactions: () => {
          const transactions = get().transactions;
          return [...transactions].sort((a, b) => b.timestamp - a.timestamp);
        },

        getTransactionById: (id) => {
          return get().transactions.find((tx) => tx.id === id);
        },

        clearHistory: () => {
          set({ transactions: [] });
        },

        deleteTransaction: (id) => {
          set((state) => ({
            transactions: state.transactions.filter((tx) => tx.id !== id),
          }));
        },

        markAsRetried: (id) => {
          set((state) => ({
            transactions: state.transactions.map((tx) =>
              tx.id === id
                ? { ...tx, status: "pending" as const, canRetry: false }
                : tx,
            ),
          }));
        },

        markFailedAsRecoveredViaEvmRecover: () => {
          set((state) => ({
            transactions: state.transactions.map((tx) =>
              tx.status === "error"
                ? {
                    ...tx,
                    status: "completed" as const,
                    recoveredViaEvmRecover: true,
                    canRetry: false,
                    errorMessage: undefined,
                    errorStep: undefined,
                  }
                : tx,
            ),
          }));
        },
      }),
      {
        name: "fast-bridge-transaction-history",
        version: 1,
      },
    ),
  );
