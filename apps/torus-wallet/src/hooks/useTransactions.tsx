import { useCallback, useEffect, useRef, useState } from "react";
import type { TransactionsFilterValues } from "~/app/_components/transactions/transactions-filters";
import { useTransactionsStore } from "~/store/transactions-store";
import type { Transaction, TransactionType, TransactionQueryOptions } from "~/store/transactions-store";

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
  const [page, setPage] = useState(1);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    if (!address) {
      setTransactions([]);
      setTotalTransactions(0);
      setHasMore(false);
      return;
    }

    setIsLoading(true);

    const options: TransactionQueryOptions = {
      page,
      limit: itemsPerPage,
      ...filtersRef.current,
    };

    const result = getTransactionsByWallet(address, options);

    setTransactions((prev) =>
      page === 1 ? result.transactions : [...prev, ...result.transactions],
    );

    setTotalTransactions(result.total);
    setHasMore(result.hasMore);
    setIsLoading(false);
  }, [address, page, itemsPerPage, getTransactionsByWallet]);

  const loadMore = useCallback(() => {
    if (hasMore && !isLoading) {
      setPage((prev) => prev + 1);
    }
  }, [hasMore, isLoading]);

  useEffect(() => {
    setPage(1);
  }, [address, filters]);

  return { transactions, totalTransactions, hasMore, loadMore, isLoading };
}
