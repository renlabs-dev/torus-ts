"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useUsdPrice } from "~/context/usd-price-provider";
import type { InjectedAccountWithMeta } from "@torus-ts/torus-provider";
import { TransactionItem } from "./transactions-item";
import { TransactionFilters } from "./transactions-filters";
import type { TransactionsFilterValues } from "./transactions-filters";
import { useTransactions } from "~/hooks/useTransactions";
import {
  TransactionsInitialLoading,
  TransactionsLoadingMore,
} from "./transactions-loading";
import { TransactionsEmptyDefault } from "./transactions-empty-state";

interface TransactionsProps {
  selectedAccount: InjectedAccountWithMeta | null;
}

export function Transactions({ selectedAccount }: TransactionsProps) {
  const { usdPrice } = useUsdPrice();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<TransactionsFilterValues>({
    orderBy: "createdAt.desc",
  });

  const { transactions, totalTransactions, loadMore, isLoading } =
    useTransactions({
      address: selectedAccount?.address,
      filters,
    });

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTimeRef = useRef<number>(0);

  const debouncedLoadMore = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      const now = Date.now();
      const timeSinceLastScroll = now - lastScrollTimeRef.current;

      if (timeSinceLastScroll >= 300) {
        loadMore();
      }
    }, 300);
  }, [loadMore]);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      lastScrollTimeRef.current = Date.now();

      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      const isAtBottom = distanceFromBottom < 10;

      if (isAtBottom && !isLoading && transactions.length > 0) {
        debouncedLoadMore();
      }
    };

    scrollElement.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      scrollElement.removeEventListener("scroll", handleScroll);
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }
    };
  }, [debouncedLoadMore, isLoading, transactions.length]);

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <TransactionFilters
        onFiltersChange={setFilters}
        totalTransactions={totalTransactions}
        currentCount={transactions.length}
        walletAddress={selectedAccount?.address}
      />
      <div
        ref={scrollRef}
        className="flex-1 flex flex-col gap-4 overflow-y-auto no-scrollbar min-h-0"
        style={{ maxHeight: "calc(100vh - 200px)" }}
      >
        {transactions.length > 0 ? (
          <div className="space-y-3">
            {transactions.map((tx, index) => (
              <TransactionItem
                key={`${tx.id}-${index}`}
                transaction={tx}
                usdPrice={usdPrice}
                index={index}
              />
            ))}
            {isLoading && <TransactionsLoadingMore />}
          </div>
        ) : isLoading ? (
          <TransactionsInitialLoading />
        ) : (
          <TransactionsEmptyDefault />
        )}
      </div>
    </div>
  );
}
