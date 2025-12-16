"use client";

import { Button } from "@torus-ts/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@torus-ts/ui/components/dialog";
import { Tabs, TabsList, TabsTrigger } from "@torus-ts/ui/components/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@torus-ts/ui/components/tooltip";
import { AlertCircle, CheckSquare, Square, Trash } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFastBridgeTransactionHistory } from "../hooks/use-fast-bridge-transaction-history";
import { TransactionHistoryItem } from "./fast-bridge-transaction-history-item";
import type {
  FastBridgeTransactionHistoryItem,
  TransactionHistoryFilter,
} from "./fast-bridge-types";

const ITEMS_PER_PAGE = 10;

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
  const transactions = useFastBridgeTransactionHistory(
    (state) => state.transactions,
  );
  const clearHistory = useFastBridgeTransactionHistory(
    (state) => state.clearHistory,
  );
  const deleteTransaction = useFastBridgeTransactionHistory(
    (state) => state.deleteTransaction,
  );
  const [filter, setFilter] = useState<TransactionHistoryFilter>("all");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [tooltipEnabled, setTooltipEnabled] = useState(false);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<
    Set<string>
  >(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Enable tooltip after 1 second to prevent it from showing on dialog open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        setTooltipEnabled(true);
      }, 1000);
      return () => {
        clearTimeout(timer);
        setTooltipEnabled(false);
      };
    }
    return undefined;
  }, [isOpen]);

  const allTransactions = useMemo(
    () => [...transactions].sort((a, b) => b.timestamp - a.timestamp),
    [transactions],
  );

  const filteredTransactions = useMemo(() => {
    switch (filter) {
      case "completed":
        return allTransactions.filter(
          (tx) => tx.status === "completed" || tx.recoveredViaEvmRecover,
        );
      case "error":
        return allTransactions.filter((tx) => tx.status === "error");
      default:
        return allTransactions;
    }
  }, [allTransactions, filter]);

  const visibleTransactions = useMemo(
    () => filteredTransactions.slice(0, visibleCount),
    [filteredTransactions, visibleCount],
  );

  const visibleTransactionsWithIndex = useMemo(
    () =>
      visibleTransactions.map((tx, index) => ({
        transaction: tx,
        originalIndex: index,
      })),
    [visibleTransactions],
  );

  const hasMore = visibleCount < filteredTransactions.length;

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) =>
      Math.min(prev + ITEMS_PER_PAGE, filteredTransactions.length),
    );
  }, [filteredTransactions.length]);

  const onScroll = useCallback(() => {
    if (!scrollContainerRef.current || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;

    // Check if scrolled to bottom (with 1px tolerance for precision issues)
    if (scrollTop + clientHeight >= scrollHeight - 1) {
      handleLoadMore();
    }
  }, [hasMore, handleLoadMore]);

  const handleFilterChange = useCallback((value: string) => {
    setFilter(value as TransactionHistoryFilter);
    setVisibleCount(ITEMS_PER_PAGE);
  }, []);

  const handleDeleteAllClick = useCallback(() => {
    setShowDeleteAllDialog(true);
  }, []);

  const handleConfirmDeleteAll = useCallback(() => {
    clearHistory();
    setShowDeleteAllDialog(false);
  }, [clearHistory]);

  const handleToggleMultiSelect = useCallback(() => {
    setIsMultiSelectMode((prev) => !prev);
    setSelectedTransactionIds(new Set());
  }, []);

  const handleSelectTransaction = useCallback(
    (transactionId: string, selected: boolean) => {
      setSelectedTransactionIds((prev) => {
        const newSet = new Set(prev);
        if (selected) {
          newSet.add(transactionId);
        } else {
          newSet.delete(transactionId);
        }
        return newSet;
      });
    },
    [],
  );

  const handleSelectAll = useCallback(() => {
    if (selectedTransactionIds.size === visibleTransactions.length) {
      setSelectedTransactionIds(new Set());
    } else {
      setSelectedTransactionIds(
        new Set(visibleTransactions.map((tx) => tx.id)),
      );
    }
  }, [selectedTransactionIds.size, visibleTransactions]);

  const handleBulkDeleteClick = useCallback(() => {
    if (selectedTransactionIds.size > 0) {
      setShowBulkDeleteDialog(true);
    }
  }, [selectedTransactionIds.size]);

  const handleConfirmBulkDelete = useCallback(() => {
    selectedTransactionIds.forEach((id) => {
      deleteTransaction(id);
    });
    setSelectedTransactionIds(new Set());
    setIsMultiSelectMode(false);
    setShowBulkDeleteDialog(false);
  }, [selectedTransactionIds, deleteTransaction]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col p-0">
        <DialogHeader className="px-6 pt-6">
          <div className="space-y-4 py-4">
            <div>
              <DialogTitle>Transaction History</DialogTitle>
              <DialogDescription>
                View and manage your Fast Bridge transaction history
              </DialogDescription>
            </div>
            <div className="flex justify-end gap-2">
              {isMultiSelectMode ? (
                <>
                  <Tooltip
                    delayDuration={500}
                    open={tooltipEnabled ? undefined : false}
                  >
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                        disabled={visibleTransactions.length === 0}
                      >
                        {selectedTransactionIds.size ===
                          visibleTransactions.length &&
                        visibleTransactions.length > 0 ? (
                          <CheckSquare className="mr-2 h-4 w-4" />
                        ) : (
                          <Square className="mr-2 h-4 w-4" />
                        )}
                        Select All
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="text-sm">
                        {selectedTransactionIds.size ===
                        visibleTransactions.length
                          ? "Deselect all transactions"
                          : "Select all visible transactions"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip
                    delayDuration={500}
                    open={tooltipEnabled ? undefined : false}
                  >
                    <TooltipTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleBulkDeleteClick}
                        disabled={selectedTransactionIds.size === 0}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete ({selectedTransactionIds.size})
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="text-sm">
                        Delete {selectedTransactionIds.size} selected
                        transaction
                        {selectedTransactionIds.size !== 1 ? "s" : ""}. This
                        action cannot be undone.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleMultiSelect}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Tooltip
                    delayDuration={500}
                    open={tooltipEnabled ? undefined : false}
                  >
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleToggleMultiSelect}
                        disabled={allTransactions.length === 0}
                      >
                        <CheckSquare className="mr-2 h-4 w-4" />
                        Select
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="text-sm">
                        Enter multi-select mode to delete multiple transactions
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip
                    delayDuration={500}
                    open={tooltipEnabled ? undefined : false}
                  >
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDeleteAllClick}
                        disabled={allTransactions.length === 0}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete All
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="text-sm">
                        Delete all transactions from history. This action cannot
                        be undone.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </>
              )}
            </div>
          </div>

          <Tabs value={filter} onValueChange={handleFilterChange}>
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1">
                All ({allTransactions.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex-1">
                Completed (
                {
                  allTransactions.filter(
                    (tx) =>
                      tx.status === "completed" || tx.recoveredViaEvmRecover,
                  ).length
                }
                )
              </TabsTrigger>
              <TabsTrigger value="error" className="flex-1">
                Failed (
                {allTransactions.filter((tx) => tx.status === "error").length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </DialogHeader>

        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-6 pb-4"
          onScroll={onScroll}
        >
          {filteredTransactions.length === 0 ? (
            <EmptyState filter={filter} />
          ) : (
            <div className="space-y-3">
              {visibleTransactionsWithIndex.map(
                ({ transaction, originalIndex }) => (
                  <TransactionHistoryItem
                    key={transaction.id}
                    transaction={transaction}
                    index={originalIndex}
                    onContinue={onContinue}
                    getExplorerUrl={getExplorerUrl}
                    isMultiSelectMode={isMultiSelectMode}
                    isSelected={selectedTransactionIds.has(transaction.id)}
                    onSelectionChange={handleSelectTransaction}
                  />
                ),
              )}
            </div>
          )}
        </div>

        <div className="bg-background flex shrink-0 justify-end gap-3 border-t px-6 py-4">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>

      {/* Delete All Confirmation Dialog */}
      <Dialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Delete all transactions?</DialogTitle>
            <DialogDescription>
              You are about to delete {allTransactions.length} transaction
              {allTransactions.length === 1 ? "" : "s"} from your history. Are
              you sure you want to do this?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteAllDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDeleteAll}>
              Delete All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Delete selected transactions?</DialogTitle>
            <DialogDescription>
              You are about to delete {selectedTransactionIds.size} selected
              transaction
              {selectedTransactionIds.size === 1 ? "" : "s"} from your history.
              Are you sure you want to do this?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBulkDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmBulkDelete}>
              Delete Selected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

function EmptyState({ filter }: { filter: TransactionHistoryFilter }) {
  const getMessage = () => {
    switch (filter) {
      case "completed":
        return "No completed transactions";
      case "error":
        return "No failed transactions";
      default:
        return "No transactions yet";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <AlertCircle className="text-muted-foreground mb-4 h-12 w-12" />
      <p className="text-muted-foreground text-sm">{getMessage()}</p>
    </div>
  );
}
