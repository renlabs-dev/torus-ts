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
import { useMemo, useState } from "react";
import { useFastBridgeTransactionHistory } from "../hooks/use-fast-bridge-transaction-history";
import { TransactionHistoryItem } from "./fast-bridge-transaction-history-item";
import type {
  FastBridgeTransactionHistoryItem,
  TransactionHistoryFilter,
} from "./fast-bridge-types";

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

  const errorCount = useMemo(
    () => allTransactions.filter((tx) => tx.status === "error").length,
    [allTransactions],
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
            onValueChange={(v) => setFilter(v as TransactionHistoryFilter)}
          >
            <div className="pb-4">
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

            <TabsContent value="all" className="mt-0 space-y-3">
              {filteredTransactions.length === 0 ? (
                <EmptyState />
              ) : (
                filteredTransactions.map((tx) => (
                  <TransactionHistoryItem
                    key={tx.id}
                    transaction={tx}
                    onContinue={onContinue}
                    getExplorerUrl={getExplorerUrl}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="completed" className="mt-0 space-y-3">
              {filteredTransactions.length === 0 ? (
                <EmptyState message="No completed transactions yet" />
              ) : (
                filteredTransactions.map((tx) => (
                  <TransactionHistoryItem
                    key={tx.id}
                    transaction={tx}
                    onContinue={onContinue}
                    getExplorerUrl={getExplorerUrl}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="error" className="mt-0 space-y-3">
              {filteredTransactions.length === 0 ? (
                <EmptyState message="No failed transactions" />
              ) : (
                filteredTransactions.map((tx) => (
                  <TransactionHistoryItem
                    key={tx.id}
                    transaction={tx}
                    onContinue={onContinue}
                    getExplorerUrl={getExplorerUrl}
                  />
                ))
              )}
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
