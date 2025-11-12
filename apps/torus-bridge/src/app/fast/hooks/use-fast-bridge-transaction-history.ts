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
  markAsRetried: (id: string) => void;
  markAsViewed: (id: string) => void;
  getUnviewedErrorCount: () => number;
}

function generateId(): string {
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

        markAsRetried: (id) => {
          set((state) => ({
            transactions: state.transactions.map((tx) =>
              tx.id === id
                ? { ...tx, status: "pending" as const, canRetry: false }
                : tx,
            ),
          }));
        },

        markAsViewed: (id) => {
          set((state) => ({
            transactions: state.transactions.map((tx) =>
              tx.id === id ? { ...tx, viewedByUser: true } : tx,
            ),
          }));
        },

        getUnviewedErrorCount: () => {
          const transactions = get().transactions;
          return transactions.filter(
            (tx) => tx.status === "error" && !tx.viewedByUser,
          ).length;
        },
      }),
      {
        name: "fast-bridge-transaction-history",
        version: 1,
      },
    ),
  );
