"use client";

import { useCallback, useEffect, useState } from "react";
import { useTransactionsStore } from "~/store/transactions-store";
import type { Transaction } from "~/store/transactions-store";
import { TransactionItem } from "./transactions-item";
import { Button } from "@torus-ts/ui/components/button";
import type { InjectedAccountWithMeta } from "@torus-ts/torus-provider";
import { useUsdPrice } from "~/context/usd-price-provider";

const ITEMS_PER_PAGE = 10;

interface UseTransactionsParams {
  address: string | undefined;
  itemsPerPage: number;
}

export function useTransactions({
  address,
  itemsPerPage,
}: UseTransactionsParams) {
  const getTransactionsByWallet = useTransactionsStore(
    (state) => state.getTransactionsByWallet,
  );
  const [page, setPage] = useState(1);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const loadTransactions = useCallback(() => {
    if (!address) {
      setTransactions([]);
      setTotalTransactions(0);
      setHasMore(false);
      return;
    }

    const result = getTransactionsByWallet(address, {
      page,
      limit: itemsPerPage,
    });
    setTransactions((prev) =>
      page === 1 ? result.transactions : [...prev, ...result.transactions],
    );
    setTotalTransactions(result.total);
    setHasMore(result.hasMore);
  }, [address, getTransactionsByWallet, page, itemsPerPage]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const loadMore = () => hasMore && setPage((prev) => prev + 1);

  return { transactions, totalTransactions, hasMore, loadMore };
}

interface TransactionsProps {
  selectedAccount: InjectedAccountWithMeta | null;
}

export function Transactions({ selectedAccount }: TransactionsProps) {
  const { usdPrice } = useUsdPrice();

  const { transactions, totalTransactions, hasMore, loadMore } =
    useTransactions({
      address: selectedAccount?.address,
      itemsPerPage: ITEMS_PER_PAGE,
    });

  return (
    <>
      <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
        <div className="text-xs text-muted-foreground" aria-live="polite">
          {transactions.length} of {totalTransactions} transactions
        </div>
        {transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                usdPrice={usdPrice}
              />
            ))}
          </div>
        ) : (
          <div
            className="flex-1 flex items-center justify-center rounded-lg border bg-card
              text-muted-foreground text-sm"
            aria-live="polite"
          >
            No transactions found
          </div>
        )}
      </div>
      {hasMore && (
        <Button
          onClick={loadMore}
          className="w-full text-sm"
          variant="outline"
          aria-label="Load more transactions"
        >
          Load More
        </Button>
      )}
    </>
  );
}
