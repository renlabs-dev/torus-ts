import type { SS58Address } from "@torus-network/sdk";
import type { TransactionResult } from "@torus-ts/ui/components/transaction-status";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TransactionType =
  | "stake"
  | "unstake"
  | "send"
  | "transfer-stake"
  | "all";

export interface Transaction {
  id: string;
  type: TransactionType;
  fromAddress: SS58Address;
  toAddress: SS58Address;
  amount: string;
  fee: string;
  status: "pending" | "success" | "error";
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
    walletAddress: string,
    options?: TransactionQueryOptions,
  ) => TransactionQueryResult;
  getTransactionById: (id: string) => Transaction | undefined;
  isTransactionCompleted: (status: TransactionResult["status"]) => boolean;
  isTransactionError: (status: TransactionResult["status"]) => boolean;
  clearTransactions: (walletAddress: string) => void;
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

      updateTransaction: (id, updates) => {
        set((state) => {
          const updatedTransactions: Record<SS58Address, Transaction[]> = {};
          for (const [address, txs] of Object.entries(state.transactions)) {
            updatedTransactions[address as SS58Address] = txs.map((tx) =>
              tx.id === id ? { ...tx, ...updates } : tx,
            );
          }
          return { transactions: updatedTransactions };
        });
      },

      getTransactionsByWallet: (walletAddress, options = {}) => {
        const {
          page = 1,
          limit = 10,
          type,
          fromAddress,
          toAddress,
          hash,
          startDate,
          endDate,
          orderBy = "createdAt.desc",
        } = options;

        const walletTxs =
          get().transactions[walletAddress as SS58Address] ?? [];

        const filtered = walletTxs.filter((tx) => {
          // Type filter
          if (type && type !== "all" && tx.type !== type) {
            return false;
          }
          
          // From address filter (case insensitive, partial match)
          if (fromAddress?.trim()) {
            const normalizedFromAddress = fromAddress.toLowerCase().trim();
            if (!tx.fromAddress.toLowerCase().includes(normalizedFromAddress)) {
              return false;
            }
          }
          
          // To address filter (case insensitive, partial match)
          if (toAddress?.trim()) {
            const normalizedToAddress = toAddress.toLowerCase().trim();
            if (!tx.toAddress.toLowerCase().includes(normalizedToAddress)) {
              return false;
            }
          }
          
          // Hash filter (case insensitive, partial match)
          if (hash?.trim()) {
            const normalizedHash = hash.toLowerCase().trim();
            if (!tx.hash?.toLowerCase().includes(normalizedHash)) {
              return false;
            }
          }
          
          // Date range filters
          if (startDate?.trim()) {
            if (new Date(tx.createdAt) < new Date(startDate)) {
              return false;
            }
          }
          
          if (endDate?.trim()) {
            if (new Date(tx.createdAt) > new Date(endDate)) {
              return false;
            }
          }
          
          return true;
        });

        const [orderField, orderDirection] = orderBy.split(".");

        const sorted = [...filtered].sort((a, b) => {
          const isAsc = orderDirection === "asc";
          if (orderField === "createdAt") {
            return isAsc
              ? new Date(a.createdAt).getTime() -
                  new Date(b.createdAt).getTime()
              : new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime();
          }
          if (orderField === "amount") {
            return isAsc
              ? Number(a.amount) - Number(b.amount)
              : Number(b.amount) - Number(a.amount);
          }
          return 0;
        });

        const start = (page - 1) * limit;
        const end = start + limit;

        return {
          transactions: sorted.slice(start, end),
          total: filtered.length,
          hasMore: end < filtered.length,
        };
      },

      getTransactionById: (id) => {
        return Object.values(get().transactions)
          .flat()
          .find((tx) => tx.id === id);
      },

      isTransactionCompleted: (status) =>
        status === "SUCCESS" || status === "ERROR",

      isTransactionError: (status) => status === "ERROR",

      clearTransactions: (walletAddress) => {
        set((state) => {
          const { [walletAddress as SS58Address]: _, ...remaining } =
            state.transactions;
          return { transactions: remaining };
        });
      },

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
