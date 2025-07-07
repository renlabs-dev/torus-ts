import type { SS58Address } from "@torus-network/sdk";
import type { TransactionResult } from "@torus-ts/torus-provider/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TransactionType = "stake" | "unstake" | "send" | "transfer-stake";

export interface Transaction {
  id: string;
  type: TransactionType;
  fromAddress: SS58Address;
  toAddress: SS58Address;
  amount: string;
  fee: string;
  status: Exclude<TransactionResult["status"], "STARTING" | null>;
  createdAt: string;
  hash?: string;
  metadata?: Record<string, unknown>;
}

export type UpdatedTransaction = Partial<Transaction>;

export interface TransactionQueryOptions {
  page?: number;
  limit?: number;
  type?: TransactionType;
  fromAddress?: string;
  toAddress?: string;
  hash?: string;
  startDate?: string;
  endDate?: string;
  orderBy?: `${keyof Pick<Transaction, "amount" | "createdAt">}.${"asc" | "desc"}`;
}

interface TransactionQueryResult {
  transactions: Transaction[];
  total: number;
  hasMore: boolean;
}

interface TransactionsState {
  transactions: Record<SS58Address, Transaction[]>;
  lastTransactionTimestamp: number;
  addTransaction: (
    transaction: Omit<Transaction, "id" | "createdAt">,
  ) => string;
  updateTransaction: (id: string, updates: UpdatedTransaction) => void;
  getTransactionsByWallet: (
    walletAddress?: string,
    options?: TransactionQueryOptions,
  ) => TransactionQueryResult;
  getTransactionById: (id: string) => Transaction | undefined;
  isTransactionCompleted: (status: TransactionResult["status"]) => boolean;
  isTransactionError: (status: TransactionResult["status"]) => boolean;
  clearTransactions: (walletAddress: SS58Address) => void;
  getLastTransactionTimestamp: () => number;
}

export const useTransactionsStore = create<TransactionsState>()(
  persist(
    (set, get) => ({
      transactions: {},
      lastTransactionTimestamp: 0,

      addTransaction: (transaction) => {
        const id = crypto.randomUUID();
        const createdAt = new Date().toISOString();
        const newTx: Transaction = { ...transaction, id, createdAt };
        const timestamp = Date.now();

        set((state) => ({
          transactions: {
            ...state.transactions,
            [transaction.fromAddress]: [
              newTx,
              ...(state.transactions[transaction.fromAddress] ?? []),
            ],
          },
          lastTransactionTimestamp: timestamp,
        }));

        return id;
      },

      updateTransaction: (id, updates) =>
        set((state) => ({
          transactions: Object.fromEntries(
            Object.entries(state.transactions).map(([address, txs]) => [
              address,
              txs.map((tx) => (tx.id === id ? { ...tx, ...updates } : tx)),
            ]),
          ),
        })),

      getTransactionsByWallet: (
        walletAddress,
        {
          page = 1,
          limit = 10,
          type,
          fromAddress,
          toAddress,
          hash,
          startDate,
          endDate,
          orderBy = "createdAt.desc",
        } = {},
      ) => {
        const walletTxs = walletAddress
          ? (get().transactions[walletAddress as SS58Address] ?? [])
          : [];

        const filtered = walletTxs.filter((tx) => {
          if (type && tx.type !== type) return false;
          if (
            fromAddress?.trim() &&
            !tx.fromAddress
              .toLowerCase()
              .includes(fromAddress.toLowerCase().trim())
          )
            return false;
          if (
            toAddress?.trim() &&
            !tx.toAddress.toLowerCase().includes(toAddress.toLowerCase().trim())
          )
            return false;
          if (
            hash?.trim() &&
            !tx.hash?.toLowerCase().includes(hash.toLowerCase().trim())
          )
            return false;
          if (startDate?.trim() && new Date(tx.createdAt) < new Date(startDate))
            return false;
          if (endDate?.trim() && new Date(tx.createdAt) > new Date(endDate))
            return false;
          return true;
        });

        const [orderField, orderDirection] = orderBy.split(".") as [
          keyof Transaction,
          "asc" | "desc",
        ];
        const sorted = [...filtered].sort((a, b) => {
          const isAsc = orderDirection === "asc";
          if (orderField === "createdAt")
            return isAsc
              ? new Date(a.createdAt).getTime() -
                  new Date(b.createdAt).getTime()
              : new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime();
          if (orderField === "amount")
            return isAsc
              ? Number(a.amount) - Number(b.amount)
              : Number(b.amount) - Number(a.amount);
          return 0;
        });

        const start = (page - 1) * limit;
        return {
          transactions: sorted.slice(start, start + limit),
          total: filtered.length,
          hasMore: start + limit < filtered.length,
        };
      },

      getTransactionById: (id) =>
        Object.values(get().transactions)
          .flat()
          .find((tx) => tx.id === id),

      isTransactionCompleted: (status) =>
        status === "SUCCESS" || status === "ERROR",

      isTransactionError: (status) => status === "ERROR",

      clearTransactions: (walletAddress) =>
        set((state) => {
          const { [walletAddress]: _, ...remaining } = state.transactions;
          return { transactions: remaining };
        }),

      getLastTransactionTimestamp: () => get().lastTransactionTimestamp,
    }),
    {
      name: "transactions",
      partialize: (state) => ({
        transactions: state.transactions,
        lastTransactionTimestamp: state.lastTransactionTimestamp,
      }),
    },
  ),
);
