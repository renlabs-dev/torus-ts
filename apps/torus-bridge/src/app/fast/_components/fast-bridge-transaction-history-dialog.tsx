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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@torus-ts/ui/components/tooltip";
import { env } from "~/env";
import { AlertCircle, Trash2 } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useFastBridgeTransactionHistory } from "../hooks/use-fast-bridge-transaction-history";
import { TransactionHistoryItem } from "./fast-bridge-transaction-history-item";
import type {
  FastBridgeTransactionHistoryItem,
  TransactionHistoryFilter,
} from "./fast-bridge-types";

const ITEMS_PER_PAGE = 10;

interface TransactionListProps {
  transactionsWithIndex: {
    transaction: FastBridgeTransactionHistoryItem;
    originalIndex: number;
  }[];
  filter: TransactionHistoryFilter;
  onContinue: (transaction: FastBridgeTransactionHistoryItem) => void;
  getExplorerUrl: (txHash: string, chainName: string) => string;
  onMarkAsViewed: (transactionId: string) => void;
}

function TransactionList({
  transactionsWithIndex,
  filter,
  onContinue,
  getExplorerUrl,
  onMarkAsViewed,
}: TransactionListProps) {
  if (transactionsWithIndex.length === 0) {
    const message =
      filter === "completed"
        ? "No completed transactions yet"
        : filter === "error"
          ? "No failed transactions"
          : "No transactions yet";
    return <EmptyState message={message} />;
  }

  return (
    <div className="space-y-3 pb-4">
      {transactionsWithIndex.map(({ transaction, originalIndex }) => (
        <TransactionHistoryItem
          key={transaction.id}
          transaction={transaction}
          index={originalIndex}
          onContinue={onContinue}
          getExplorerUrl={getExplorerUrl}
          onMarkAsViewed={onMarkAsViewed}
        />
      ))}
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
  const { getTransactions, markAsViewed, clearHistory } =
    useFastBridgeTransactionHistory();
  const [filter, setFilter] = useState<TransactionHistoryFilter>("all");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  // Map each visible transaction to its original index in filteredTransactions
  const visibleTransactionsWithIndex = useMemo(
    () =>
      visibleTransactions.map((tx, visibleIndex) => ({
        transaction: tx,
        originalIndex: visibleIndex, // This is already the correct index since we're slicing from 0
      })),
    [visibleTransactions],
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

  const onScroll = useCallback(() => {
    if (!scrollContainerRef.current || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;

    // Check if scrolled to bottom (with 1px tolerance for precision issues)
    if (scrollTop + clientHeight >= scrollHeight - 1) {
      handleLoadMore();
    }
  }, [hasMore, handleLoadMore]);

  const isDevelopment = env("NEXT_PUBLIC_NODE_ENV") === "development";

  const handleClearHistory = useCallback(() => {
    if (
      window.confirm(
        "Are you sure you want to clear all transaction history? This action cannot be undone.",
      )
    ) {
      clearHistory();
    }
  }, [clearHistory]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col p-0">
        <DialogHeader className="px-6 pt-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle>Transaction History</DialogTitle>
              <DialogDescription>
                View and manage your Fast Bridge transaction history
              </DialogDescription>
            </div>
            {isDevelopment && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearHistory}
                      className="ml-4 shrink-0"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Clear
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="text-sm">
                      Clear all transaction history. This feature is only
                      available in development and PR preview environments for
                      testing purposes.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </DialogHeader>

        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-6"
          onScroll={onScroll}
        >
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
                transactionsWithIndex={visibleTransactionsWithIndex}
                filter={filter}
                onContinue={onContinue}
                getExplorerUrl={getExplorerUrl}
                onMarkAsViewed={markAsViewed}
              />
            </TabsContent>

            <TabsContent value="completed" className="mt-0">
              <TransactionList
                key={`${filter}-${isOpen}`}
                transactionsWithIndex={visibleTransactionsWithIndex}
                filter={filter}
                onContinue={onContinue}
                getExplorerUrl={getExplorerUrl}
                onMarkAsViewed={markAsViewed}
              />
            </TabsContent>

            <TabsContent value="error" className="mt-0">
              <TransactionList
                key={`${filter}-${isOpen}`}
                transactionsWithIndex={visibleTransactionsWithIndex}
                filter={filter}
                onContinue={onContinue}
                getExplorerUrl={getExplorerUrl}
                onMarkAsViewed={markAsViewed}
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
