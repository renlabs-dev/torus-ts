"use client";

import { Badge } from "@torus-ts/ui/components/badge";
import { Button } from "@torus-ts/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@torus-ts/ui/components/dialog";
import { AlertTriangle, ArrowRight, Clock, Trash2 } from "lucide-react";
import type { FastBridgeTransactionHistoryItem } from "./fast-bridge-types";

interface PendingTransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pendingTransaction: FastBridgeTransactionHistoryItem;
  onResume: (transaction: FastBridgeTransactionHistoryItem) => void;
  onDeleteAndStartNew: (transactionId: string) => void;
}

function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ago`;
  }
  if (minutes > 0) {
    return `${minutes}m ago`;
  }
  return "Just now";
}

function getStatusLabel(status: FastBridgeTransactionHistoryItem["status"]) {
  switch (status) {
    case "pending":
      return "Awaiting confirmation";
    case "step1_complete":
      return "Step 1 complete, awaiting Step 2";
    default:
      return status;
  }
}

export function PendingTransactionDialog({
  isOpen,
  onClose,
  pendingTransaction,
  onResume,
  onDeleteAndStartNew,
}: PendingTransactionDialogProps) {
  const directionLabel =
    pendingTransaction.direction === "base-to-native"
      ? "Base → Torus"
      : "Torus → Base";

  const handleResume = () => {
    onResume(pendingTransaction);
    onClose();
  };

  const handleDeleteAndStartNew = () => {
    onDeleteAndStartNew(pendingTransaction.id);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Pending Transaction Found
          </DialogTitle>
          <DialogDescription>
            You have a pending transaction that hasn&apos;t been completed yet.
            Would you like to resume it or start a new one?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="text-muted-foreground h-4 w-4" />
                <span className="text-sm font-medium">
                  {formatTimestamp(pendingTransaction.timestamp)}
                </span>
              </div>
              <Badge
                variant="outline"
                className="border-yellow-500 text-yellow-500"
              >
                Pending
              </Badge>
            </div>

            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Direction:</span>
                <span className="font-medium">{directionLabel}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-medium">
                  {pendingTransaction.amount} TORUS
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium">
                  {getStatusLabel(pendingTransaction.status)}
                </span>
              </div>

              {(pendingTransaction.baseAddress ||
                pendingTransaction.nativeAddress) && (
                <div className="mt-2 flex items-center gap-2 text-xs">
                  {pendingTransaction.direction === "base-to-native" ? (
                    <>
                      {pendingTransaction.baseAddress && (
                        <span className="text-muted-foreground font-mono">
                          {pendingTransaction.baseAddress.slice(0, 6)}...
                          {pendingTransaction.baseAddress.slice(-4)}
                        </span>
                      )}
                      <ArrowRight className="text-muted-foreground h-3 w-3" />
                      {pendingTransaction.nativeAddress && (
                        <span className="text-muted-foreground font-mono">
                          {pendingTransaction.nativeAddress.slice(0, 6)}...
                          {pendingTransaction.nativeAddress.slice(-4)}
                        </span>
                      )}
                    </>
                  ) : (
                    <>
                      {pendingTransaction.nativeAddress && (
                        <span className="text-muted-foreground font-mono">
                          {pendingTransaction.nativeAddress.slice(0, 6)}...
                          {pendingTransaction.nativeAddress.slice(-4)}
                        </span>
                      )}
                      <ArrowRight className="text-muted-foreground h-3 w-3" />
                      {pendingTransaction.baseAddress && (
                        <span className="text-muted-foreground font-mono">
                          {pendingTransaction.baseAddress.slice(0, 6)}...
                          {pendingTransaction.baseAddress.slice(-4)}
                        </span>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="text-muted-foreground text-xs">
            <p>
              <strong>Resume:</strong> Continue the pending transaction from
              where it left off.
            </p>
            <p className="mt-1">
              <strong>Delete & Start New:</strong> Delete the pending
              transaction and start a fresh one.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-between">
          <Button
            variant="outline"
            onClick={handleDeleteAndStartNew}
            className="flex-1"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete & Start New
          </Button>
          <Button onClick={handleResume} className="flex-1">
            Resume Transaction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
