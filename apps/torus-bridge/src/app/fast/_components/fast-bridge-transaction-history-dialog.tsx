"use client";

import { Button } from "@torus-ts/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@torus-ts/ui/components/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@torus-ts/ui/components/tabs";
import { AlertCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFastBridgeTransactionHistory } from "../hooks/use-fast-bridge-transaction-history";
import { TransactionHistoryItem } from "./fast-bridge-transaction-history-item";
import type {
  FastBridgeTransactionHistoryItem,
  TransactionHistoryFilter,
} from "./fast-bridge-types";

const ITEMS_PER_PAGE = 10;

interface TransactionListProps {
  transactions: FastBridgeTransactionHistoryItem[];
  filter: TransactionHistoryFilter;
  totalCount: number;
  onContinue: (transaction: FastBridgeTransactionHistoryItem) => void;
  getExplorerUrl: (txHash: string, chainName: string) => string;
  onLoadMore: () => void;
  hasMore: boolean;
  visibleCount: number;
}

function TransactionList({
  transactions,
  filter,
  totalCount,
  onContinue,
  getExplorerUrl,
  onLoadMore,
  hasMore,
  visibleCount,
}: TransactionListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

    // Load more when scrolled to 80%
    if (scrollPercentage > 0.8) {
      onLoadMore();
    }
  }, [hasMore, onLoadMore]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  if (transactions.length === 0) {
    const message =
      filter === "completed"
        ? "No completed transactions yet"
        : filter === "error"
          ? "No failed transactions"
          : "No transactions yet";
    return <EmptyState message={message} />;
  }

  return (
    <div ref={scrollContainerRef} className="space-y-3 pb-4">
      {transactions.map((tx) => (
        <TransactionHistoryItem
          key={tx.id}
          transaction={tx}
          onContinue={onContinue}
          getExplorerUrl={getExplorerUrl}
        />
      ))}
      {hasMore && (
        <LoadingIndicator visible={visibleCount} total={totalCount} />
      )}
    </div>
  );
}

interface TransactionHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: (transaction: FastBridgeTransactionHistoryItem) => void;
  getExplorerUrl: (txHash: string, chainName: string) => string;
}

export function TransactionHistoryDialog({
  isOpen,
  onClose,
  onContinue,
  getExplorerUrl,
}: TransactionHistoryDialogProps) {
  const { getTransactions } = useFastBridgeTransactionHistory();
  const [filter, setFilter] = useState<TransactionHistoryFilter>("all");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  const allTransactions = getTransactions();

  const filteredTransactions = useMemo(() => {
    if (filter === "all") {
      return allTransactions;
    }
    if (filter === "completed") {
      return allTransactions.filter((tx) => tx.status === "completed");
    }
    // filter === "error"
    return allTransactions.filter((tx) => tx.status === "error");
  }, [allTransactions, filter]);

  const visibleTransactions = useMemo(
    () => filteredTransactions.slice(0, visibleCount),
    [filteredTransactions, visibleCount],
  );

  const hasMore = visibleCount < filteredTransactions.length;

  const errorCount = useMemo(
    () => allTransactions.filter((tx) => tx.status === "error").length,
    [allTransactions],
  );

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) =>
      Math.min(prev + ITEMS_PER_PAGE, filteredTransactions.length),
    );
  }, [filteredTransactions.length]);

  const handleFilterChange = useCallback(
    (newFilter: TransactionHistoryFilter) => {
      setFilter(newFilter);
      setVisibleCount(ITEMS_PER_PAGE);
    },
    [],
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col p-0">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>Transaction History</DialogTitle>
          <DialogDescription>
            View and manage your Fast Bridge transaction history
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <Tabs
            value={filter}
            onValueChange={(v) =>
              handleFilterChange(v as TransactionHistoryFilter)
            }
          >
            <div className="bg-background sticky top-0 z-10 pb-4 pt-2">
              <TabsList>
                <TabsTrigger value="all">
                  All ({allTransactions.length})
                </TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="error">
                  Failed {errorCount > 0 && `(${errorCount})`}
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="all" className="mt-0">
              <TransactionList
                key={`${filter}-${isOpen}`}
                transactions={visibleTransactions}
                filter={filter}
                totalCount={filteredTransactions.length}
                onContinue={onContinue}
                getExplorerUrl={getExplorerUrl}
                onLoadMore={handleLoadMore}
                hasMore={hasMore}
                visibleCount={visibleCount}
              />
            </TabsContent>

            <TabsContent value="completed" className="mt-0">
              <TransactionList
                key={`${filter}-${isOpen}`}
                transactions={visibleTransactions}
                filter={filter}
                totalCount={filteredTransactions.length}
                onContinue={onContinue}
                getExplorerUrl={getExplorerUrl}
                onLoadMore={handleLoadMore}
                hasMore={hasMore}
                visibleCount={visibleCount}
              />
            </TabsContent>

            <TabsContent value="error" className="mt-0">
              <TransactionList
                key={`${filter}-${isOpen}`}
                transactions={visibleTransactions}
                filter={filter}
                totalCount={filteredTransactions.length}
                onContinue={onContinue}
                getExplorerUrl={getExplorerUrl}
                onLoadMore={handleLoadMore}
                hasMore={hasMore}
                visibleCount={visibleCount}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="bg-background flex shrink-0 justify-end gap-3 border-t px-6 py-4">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({ message = "No transactions yet" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertCircle className="text-muted-foreground mb-4 h-12 w-12" />
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}

function LoadingIndicator({
  visible,
  total,
}: {
  visible: number;
  total: number;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <div className="text-muted-foreground text-sm">
        Showing {visible} of {total} transactions
      </div>
      <div className="text-muted-foreground mt-1 text-xs">
        Scroll down to load more...
      </div>
    </div>
  );
}
