import { useCallback, useEffect, useState } from "react";
import type { TransactionsFilterValues } from "~/app/_components/transactions/transactions-filters";
import { useTransactionsStore } from "~/store/transactions-store";
import type {
  Transaction,
  TransactionQueryOptions,
} from "~/store/transactions-store";

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


  const [page, setPage] = useState(1);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);


  function resetState() {
    setTransactions([]);
    setTotalTransactions(0);
    setHasMore(false);
    setIsLoading(false);
  }

  // Reset everything when address changes
  useEffect(() => {
    if (!address) {
      resetState();
      return;
    }
    
    // When address changes, start fresh
    setPage(1);
    setTransactions([]);
  }, [address]);

  // Reset everything when filters change
  useEffect(() => {
    setPage(1);
    setTransactions([]);
  }, [filters]);

  // Auto-refresh when new transactions are added
  useEffect(() => {
    if (lastTransactionTimestamp > 0) {
      setPage(1);
      setTransactions([]);
    }
  }, [lastTransactionTimestamp]);

  // Main effect: Load transactions when page, address, or filters change
  useEffect(() => {
    if (!address) {
      resetState();
      return;
    }

    // Helper function to load a page of transactions
    function loadTransactionsPage() {
      setIsLoading(true);

      // Small delay to prevent rapid calls and improve UX
      const delay = page === 1 ? 0 : 100;
      
      setTimeout(() => {
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
    }

    loadTransactionsPage();
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
    isLoading 
  };
}
