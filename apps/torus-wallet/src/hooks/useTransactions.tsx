import type { TransactionsFilterValues } from "~/app/_components/transactions/transactions-filters";
import type {
  Transaction,
  TransactionQueryOptions,
} from "~/store/transactions-store";
import { useTransactionsStore } from "~/store/transactions-store";
import { useCallback, useEffect, useState } from "react";

const ITEMS_PER_PAGE = 10;

interface UseTransactionsParams {
  address: string | undefined;
  itemsPerPage?: number;
  filters: TransactionsFilterValues;
}

export function useTransactions({
  address,
  itemsPerPage = ITEMS_PER_PAGE,
  filters,
}: UseTransactionsParams) {
  const getTransactionsByWallet = useTransactionsStore(
    (state) => state.getTransactionsByWallet,
  );
  const lastTransactionTimestamp = useTransactionsStore(
    (state) => state.lastTransactionTimestamp,
  );

  const resetKey = `${address || "no-address"}-${JSON.stringify(filters)}-${lastTransactionTimestamp}`;

  const [currentResetKey, setCurrentResetKey] = useState(resetKey);
  const [page, setPage] = useState(1);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (currentResetKey !== resetKey) {
    setCurrentResetKey(resetKey);
    setPage(1);
    setTransactions([]);
    setTotalTransactions(0);
    setHasMore(false);
    setIsLoading(false);
  }

  useEffect(() => {
    if (!address) {
      return;
    }

    // Helper function to load a page of transactions
    function loadTransactionsPage() {
      setIsLoading(true);

      // Small delay to prevent rapid calls and improve UX
      const delay = page === 1 ? 0 : 100;

      const timeoutId = setTimeout(() => {
        const options: TransactionQueryOptions = {
          page,
          limit: itemsPerPage,
          type: filters.type,
          fromAddress: filters.fromAddress,
          toAddress: filters.toAddress,
          hash: filters.hash,
          startDate: filters.startDate,
          endDate: filters.endDate,
          orderBy: filters.orderBy,
        };

        if (!address) return;

        const result = getTransactionsByWallet(address, options);

        // For page 1, replace all transactions. For other pages, append
        setTransactions((prev) =>
          page === 1 ? result.transactions : [...prev, ...result.transactions],
        );
        setTotalTransactions(result.total);
        setHasMore(result.hasMore);
        setIsLoading(false);
      }, delay);

      // Return cleanup function to prevent memory leaks
      return () => clearTimeout(timeoutId);
    }

    const cleanup = loadTransactionsPage();
    return cleanup;
  }, [address, page, filters, itemsPerPage, getTransactionsByWallet]);

  // Load more transactions (for infinite scroll)
  const loadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      setPage((prev) => prev + 1);
    }
  }, [hasMore, isLoading]);

  // Manual refresh function
  const refresh = useCallback(() => {
    setPage(1);
    setTransactions([]);
  }, []);

  return {
    transactions,
    totalTransactions,
    hasMore,
    loadMore,
    refresh,
    isLoading,
  };
}
