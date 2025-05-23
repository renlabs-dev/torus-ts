"use client";

import { useEffect, useRef, useState } from "react";
import { useUsdPrice } from "~/context/usd-price-provider";
import type { InjectedAccountWithMeta } from "@torus-ts/torus-provider";
import { TransactionItem } from "./transactions-item";
import { TransactionFilters } from "./transactions-filters";
import type { TransactionsFilterValues } from "./transactions-filters";
import { useTransactions } from "~/hooks/useTransactions";

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

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      // Trigger load more when user scrolls to within 50px of bottom
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
      
      if (isNearBottom && !isLoading && transactions.length > 0) {
        loadMore();
      }
    };

    scrollElement.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollElement.removeEventListener("scroll", handleScroll);
  }, [loadMore, isLoading, transactions.length]);

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <TransactionFilters
        onFiltersChange={setFilters}
        totalTransactions={totalTransactions}
        currentCount={transactions.length}
      />
      <div
        ref={scrollRef}
        className="flex-1 flex flex-col gap-4 overflow-y-auto no-scrollbar min-h-0"
        style={{ maxHeight: 'calc(100vh - 200px)' }}
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
            {isLoading && (
              <div className="flex justify-center py-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Loading more transactions...
                </div>
              </div>
            )}
          </div>
        ) : isLoading ? (
          <div className="flex-1 flex items-center justify-center min-h-[200px]">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
              Loading transactions...
            </div>
          </div>
        ) : (
          <div
            className="flex-1 flex items-center justify-center rounded-lg border bg-card
              text-muted-foreground text-sm min-h-[200px]"
            aria-live="polite"
          >
            No transactions found
          </div>
        )}
      </div>
    </div>
  );
}
