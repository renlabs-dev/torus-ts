"use client";

import { Badge } from "@torus-ts/ui/components/badge";
import { Button } from "@torus-ts/ui/components/button";
import { cn } from "@torus-ts/ui/lib/utils";
import { ChevronDown, ChevronUp, ExternalLink, RotateCw } from "lucide-react";
import { useState } from "react";
import type { FastBridgeTransactionHistoryItem } from "./fast-bridge-types";

interface TransactionHistoryItemProps {
  transaction: FastBridgeTransactionHistoryItem;
  index: number;
  onContinue: (transaction: FastBridgeTransactionHistoryItem) => void;
  getExplorerUrl: (txHash: string, chainName: string) => string;
  onMarkAsViewed: (transactionId: string) => void;
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
  onMarkAsViewed,
}: TransactionHistoryItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const directionLabel =
    transaction.direction === "base-to-native"
      ? "Base → Native"
      : "Native → Base";

  const handleCardClick = () => {
    if (transaction.status === "error") {
      setIsExpanded((prev) => !prev);
      // Mark as viewed when expanding error transaction
      if (!transaction.viewedByUser) {
        onMarkAsViewed(transaction.id);
      }
    }
  };

  const handleContinue = () => {
    // Mark as viewed when clicking Continue
    if (!transaction.viewedByUser) {
      onMarkAsViewed(transaction.id);
    }
    onContinue(transaction);
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
            {/* Unviewed error indicator */}
            {transaction.status === "error" && !transaction.viewedByUser && (
              <div className="relative flex h-3 w-3 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
              </div>
            )}
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
        </div>

        <div className="flex gap-2">
          {transaction.status === "error" && (
            <Button size="sm" variant="outline" onClick={handleContinue}>
              <RotateCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          )}
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
      </div>

      {isExpanded && (
        <div className="bg-muted/50 mt-4 space-y-3 rounded-md p-3 text-sm">
          {transaction.errorMessage && (
            <div className="text-red-500">
              <div className="font-medium">Error:</div>
              <div className="text-muted-foreground mt-1 text-xs">
                {transaction.errorMessage}
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
                  transaction.direction === "base-to-native"
                    ? "Torus EVM"
                    : "Torus EVM",
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
    </div>
  );
}
