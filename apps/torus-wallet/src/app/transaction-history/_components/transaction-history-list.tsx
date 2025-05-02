"use client";

import { formatAmount } from "@torus-network/torus-utils/amount";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@torus-ts/ui/components/table";
import { TransactionStatus } from "@torus-ts/ui/components/transaction-status";
import { Badge } from "@torus-ts/ui/components/badge";
import { Skeleton } from "@torus-ts/ui/components/skeleton";
import { useState, useEffect } from "react";
import { useWallet } from "~/context/wallet-provider";
import { formatDate } from "~/utils/helpers";
import { TransactionDetailsDialog } from "./transaction-details-dialog";
import { useTransactionHistory } from "../hooks/use-transaction-history";
import type { TransactionHistoryRecord } from "@torus-ts/db";

export function TransactionHistoryList() {
  const { selectedAccount } = useWallet();
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionHistoryRecord | null>(null);
  
  const address = selectedAccount?.address || "";
  const { transactions, isLoading } = useTransactionHistory(address);

  if (isLoading) {
    return <TransactionHistoryListSkeleton />;
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <div>
          <h3 className="mb-2 text-lg font-medium">No transactions found</h3>
          <p className="text-sm text-muted-foreground">
            Transactions will appear here once you start using your wallet.
          </p>
        </div>
      </div>
    );
  }

  const handleRowClick = (transaction: TransactionHistoryRecord) => {
    setSelectedTransaction(transaction);
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead className="text-right">From/To</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow
              key={transaction.id}
              className="cursor-pointer"
              onClick={() => handleRowClick(transaction)}
            >
              <TableCell>
                <Badge
                  variant={getTransactionTypeBadgeVariant(transaction.type)}
                >
                  {formatTransactionType(transaction.type)}
                </Badge>
              </TableCell>
              <TableCell>{formatDate(transaction.createdAt)}</TableCell>
              <TableCell>
                <TransactionStatus status={transaction.status} size="sm" />
              </TableCell>
              <TableCell>{formatAmount(transaction.amount)} TORUS</TableCell>
              <TableCell className="text-right font-mono">
                {truncateAddress(
                  transaction.type === "SEND"
                    ? transaction.toAddress
                    : transaction.fromAddress
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <TransactionDetailsDialog
        transaction={selectedTransaction}
        open={!!selectedTransaction}
        onOpenChange={(open) => {
          if (!open) setSelectedTransaction(null);
        }}
      />
    </div>
  );
}

function formatTransactionType(type: string) {
  switch (type) {
    case "SEND":
      return "Send";
    case "STAKE":
      return "Stake";
    case "UNSTAKE":
      return "Unstake";
    case "TRANSFER_STAKE":
      return "Transfer Stake";
    default:
      return type;
  }
}

function getTransactionTypeBadgeVariant(
  type: string
): "default" | "secondary" | "destructive" | "outline" {
  switch (type) {
    case "SEND":
      return "destructive";
    case "STAKE":
      return "default";
    case "UNSTAKE":
      return "secondary";
    case "TRANSFER_STAKE":
      return "outline";
    default:
      return "default";
  }
}

function truncateAddress(address: string) {
  if (!address) return "";
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function TransactionHistoryListSkeleton() {
  return (
    <div className="space-y-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead className="text-right">From/To</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 5 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-6 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-28" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="ml-auto h-6 w-24" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}