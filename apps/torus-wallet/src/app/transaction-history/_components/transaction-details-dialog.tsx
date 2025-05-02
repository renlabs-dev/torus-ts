"use client";

import { formatAmount } from "@torus-network/torus-utils/amount";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@torus-ts/ui/components/dialog";
import { Button } from "@torus-ts/ui/components/button";
import { TransactionStatus } from "@torus-ts/ui/components/transaction-status";
import { Badge } from "@torus-ts/ui/components/badge";
import { CopyButton } from "@torus-ts/ui/components/copy-button";
import type { TransactionHistoryRecord } from "@torus-ts/db";
import { formatDate } from "~/utils/helpers";

interface TransactionDetailsDialogProps {
  transaction: TransactionHistoryRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransactionDetailsDialog({
  transaction,
  open,
  onOpenChange,
}: TransactionDetailsDialogProps) {
  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[485px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Transaction Details
            <Badge variant={getTransactionTypeBadgeVariant(transaction.type)}>
              {formatTransactionType(transaction.type)}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Completed on {formatDate(transaction.createdAt, true)}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <TransactionStatus status={transaction.status} size="sm" />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Amount</span>
            <span className="font-medium">
              {formatAmount(transaction.amount)} TORUS
            </span>
          </div>

          {transaction.fee ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Network Fee</span>
              <span className="font-medium">
                {formatAmount(transaction.fee)} TORUS
              </span>
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">From</span>
            <div className="flex items-center gap-1">
              <span className="font-mono text-sm">{transaction.fromAddress}</span>
              <CopyButton
                value={transaction.fromAddress}
                variant="ghost"
                size="sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">To</span>
            <div className="flex items-center gap-1">
              <span className="font-mono text-sm">{transaction.toAddress}</span>
              <CopyButton
                value={transaction.toAddress}
                variant="ghost"
                size="sm"
              />
            </div>
          </div>

          {transaction.hash ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Transaction Hash
              </span>
              <div className="flex items-center gap-1">
                <span className="font-mono text-sm">
                  {truncateHash(transaction.hash)}
                </span>
                <CopyButton
                  value={transaction.hash}
                  variant="ghost"
                  size="sm"
                />
              </div>
            </div>
          ) : null}

          {transaction.blockHeight ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Block</span>
              <span className="font-medium">{transaction.blockHeight}</span>
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="w-full">
              Close
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

function truncateHash(hash: string) {
  if (!hash) return "";
  return `${hash.slice(0, 6)}...${hash.slice(-6)}`;
}