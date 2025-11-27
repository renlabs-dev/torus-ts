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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@torus-ts/ui/components/tooltip";
import { cn } from "@torus-ts/ui/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  RotateCw,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { formatErrorForUser } from "../hooks/fast-bridge-helpers";
import type { FastBridgeTransactionHistoryItem } from "./fast-bridge-types";

interface TransactionHistoryItemProps {
  transaction: FastBridgeTransactionHistoryItem;
  index: number;
  onContinue: (transaction: FastBridgeTransactionHistoryItem) => void;
  getExplorerUrl: (txHash: string, chainName: string) => string;
  onDelete: (transactionId: string) => void;
}

function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 1) {
    return new Date(timestamp).toLocaleDateString();
  }
  if (days === 1) {
    return "Yesterday";
  }
  if (hours > 0) {
    return `${hours}h ago`;
  }
  if (minutes > 0) {
    return `${minutes}m ago`;
  }
  return "Just now";
}

function getStatusBadge(status: FastBridgeTransactionHistoryItem["status"]) {
  switch (status) {
    case "completed":
      return (
        <Badge variant="outline" className="border-green-500 text-green-500">
          Success
        </Badge>
      );
    case "error":
      return (
        <Badge variant="outline" className="border-red-500 text-red-500">
          Error
        </Badge>
      );
    case "step1_complete":
      return (
        <Badge variant="outline" className="border-yellow-500 text-yellow-500">
          Step 1 Complete
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="outline" className="border-yellow-500 text-yellow-500">
          Pending
        </Badge>
      );
  }
}

export function TransactionHistoryItem({
  transaction,
  index,
  onContinue,
  getExplorerUrl,
  onDelete,
}: TransactionHistoryItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const directionLabel =
    transaction.direction === "base-to-native"
      ? "Base → Native"
      : "Native → Base";

  const handleCardClick = () => {
    if (transaction.status === "error") {
      setIsExpanded((prev) => !prev);
    }
  };

  const handleContinue = () => {
    onContinue(transaction);
  };

  const handleDelete = () => {
    onDelete(transaction.id);
    setShowDeleteDialog(false);
  };

  return (
    <div className="border-border bg-card rounded-lg border p-4">
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex-1",
            transaction.status === "error" && "cursor-pointer",
          )}
          onClick={handleCardClick}
        >
          <div className="flex items-center gap-3">
            <Badge
              variant="secondary"
              className="text-muted-foreground font-mono text-xs"
            >
              #{index + 1}
            </Badge>
            <span className="text-sm font-medium">{directionLabel}</span>
            {getStatusBadge(transaction.status)}
          </div>
          <div className="text-muted-foreground mt-1 text-sm">
            {transaction.amount} TORUS
          </div>
          <div className="text-muted-foreground mt-1 text-xs">
            {formatTimestamp(transaction.timestamp)}
          </div>

          {(transaction.step1TxHash || transaction.step2TxHash) && (
            <div className="mt-2 flex items-center gap-2">
              {transaction.step1TxHash && (
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (transaction.step1TxHash) {
                            window.open(
                              getExplorerUrl(
                                transaction.step1TxHash,
                                transaction.direction === "base-to-native"
                                  ? "Base"
                                  : "Torus Native",
                              ),
                              "_blank",
                              "noopener,noreferrer",
                            );
                          }
                        }}
                      >
                        <ExternalLink className="h-3 w-3" />
                        Step 1
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-xs">
                        View Step 1 transaction on{" "}
                        {transaction.direction === "base-to-native"
                          ? "Base"
                          : "Torus Native"}{" "}
                        explorer
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {transaction.step2TxHash && (
                <TooltipProvider delayDuration={300}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 px-2 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (transaction.step2TxHash) {
                            window.open(
                              getExplorerUrl(
                                transaction.step2TxHash,
                                "Torus EVM",
                              ),
                              "_blank",
                              "noopener,noreferrer",
                            );
                          }
                        }}
                      >
                        <ExternalLink className="h-3 w-3" />
                        Step 2
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-xs">
                        View Step 2 transaction on Torus EVM explorer
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          )}
        </div>

        <TooltipProvider delayDuration={5000}>
          <div className="flex gap-2">
            {transaction.status === "error" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" onClick={handleContinue}>
                    <RotateCw className="mr-2 h-4 w-4" />
                    Retry
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">Retry this failed transaction</p>
                </TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">Delete this transaction from history</p>
              </TooltipContent>
            </Tooltip>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </TooltipProvider>
      </div>

      {isExpanded && (
        <div className="bg-muted/50 mt-4 space-y-3 rounded-md p-3 text-sm">
          {transaction.errorMessage && (
            <div className="text-red-500">
              <div className="font-medium">Error:</div>
              <div className="text-muted-foreground mt-1 text-xs">
                {formatErrorForUser(new Error(transaction.errorMessage))}
              </div>
              {transaction.errorStep && (
                <div className="text-muted-foreground mt-1 text-xs">
                  Failed at step {transaction.errorStep}
                </div>
              )}
            </div>
          )}

          {transaction.step1TxHash && (
            <div>
              <div className="text-muted-foreground mb-1 text-xs">
                Step 1 Transaction:
              </div>
              <a
                href={getExplorerUrl(
                  transaction.step1TxHash,
                  transaction.direction === "base-to-native"
                    ? "Base"
                    : "Torus Native",
                )}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "text-primary flex items-center gap-1 break-all text-xs hover:underline",
                )}
              >
                {transaction.step1TxHash.slice(0, 10)}...
                {transaction.step1TxHash.slice(-8)}
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </div>
          )}

          {transaction.step2TxHash && (
            <div>
              <div className="text-muted-foreground mb-1 text-xs">
                Step 2 Transaction:
              </div>
              <a
                href={getExplorerUrl(
                  transaction.step2TxHash,
                  "Torus EVM", // Step 2 always occurs on Torus EVM regardless of direction
                )}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "text-primary flex items-center gap-1 break-all text-xs hover:underline",
                )}
              >
                {transaction.step2TxHash.slice(0, 10)}...
                {transaction.step2TxHash.slice(-8)}
                <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </div>
          )}

          {transaction.baseAddress && (
            <div>
              <div className="text-muted-foreground mb-1 text-xs">
                Base Address:
              </div>
              <div className="break-all text-xs">
                {transaction.baseAddress.slice(0, 10)}...
                {transaction.baseAddress.slice(-8)}
              </div>
            </div>
          )}

          {transaction.evmAddress && (
            <div>
              <div className="text-muted-foreground mb-1 text-xs">
                EVM Address:
              </div>
              <div className="break-all text-xs">
                {transaction.evmAddress.slice(0, 10)}...
                {transaction.evmAddress.slice(-8)}
              </div>
            </div>
          )}

          {transaction.nativeAddress && (
            <div>
              <div className="text-muted-foreground mb-1 text-xs">
                Native Address:
              </div>
              <div className="break-all text-xs">
                {transaction.nativeAddress.slice(0, 10)}...
                {transaction.nativeAddress.slice(-8)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this transaction?</DialogTitle>
            <DialogDescription>This action cannot be undone.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-muted-foreground">Direction:</div>
              <div>{directionLabel}</div>

              <div className="text-muted-foreground">Amount:</div>
              <div>{transaction.amount} TORUS</div>

              <div className="text-muted-foreground">Status:</div>
              <div>{getStatusBadge(transaction.status)}</div>

              <div className="text-muted-foreground">Date:</div>
              <div>{formatTimestamp(transaction.timestamp)}</div>
            </div>

            {transaction.errorMessage && (
              <div className="bg-muted/50 rounded-md p-3">
                <div className="text-sm font-medium text-red-500">Error:</div>
                <div className="text-muted-foreground mt-1 text-xs">
                  {formatErrorForUser(new Error(transaction.errorMessage))}
                </div>
              </div>
            )}

            {transaction.step1TxHash && (
              <div className="bg-muted/50 rounded-md p-2 text-xs">
                <div className="text-muted-foreground mb-1">Step 1 Hash:</div>
                <div className="break-all font-mono">
                  {transaction.step1TxHash.slice(0, 20)}...
                  {transaction.step1TxHash.slice(-20)}
                </div>
              </div>
            )}

            {transaction.step2TxHash && (
              <div className="bg-muted/50 rounded-md p-2 text-xs">
                <div className="text-muted-foreground mb-1">Step 2 Hash:</div>
                <div className="break-all font-mono">
                  {transaction.step2TxHash.slice(0, 20)}...
                  {transaction.step2TxHash.slice(-20)}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
