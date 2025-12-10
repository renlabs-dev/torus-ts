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
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Play,
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

function getStatusBadge(
  status: FastBridgeTransactionHistoryItem["status"],
  recoveredViaEvmRecover?: boolean,
) {
  if (recoveredViaEvmRecover) {
    return (
      <Badge variant="outline" className="border-green-500 text-green-500">
        Recovered
      </Badge>
    );
  }

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
            {getStatusBadge(
              transaction.status,
              transaction.recoveredViaEvmRecover,
            )}
          </div>
          <div className="text-muted-foreground mt-1 text-sm">
            {transaction.amount} TORUS
          </div>
          <div className="text-muted-foreground mt-1 text-xs">
            {formatTimestamp(transaction.timestamp)}
          </div>
        </div>

        <TooltipProvider delayDuration={500}>
          <div className="flex gap-2">
            {(transaction.status === "pending" ||
              transaction.status === "step1_complete") && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" onClick={handleContinue}>
                    <Play className="mr-2 h-4 w-4" />
                    Resume
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">Resume this pending transaction</p>
                </TooltipContent>
              </Tooltip>
            )}
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
          {/* Address details */}
          {(transaction.baseAddress || transaction.nativeAddress) && (
            <div className="flex items-center gap-3 text-xs">
              {transaction.direction === "base-to-native" ? (
                <>
                  {transaction.baseAddress && (
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground font-medium">
                        Base Address
                      </span>
                      <span className="font-mono">
                        {transaction.baseAddress.slice(0, 6)}...
                        {transaction.baseAddress.slice(-4)}
                      </span>
                    </div>
                  )}
                  <ArrowRight className="text-muted-foreground h-4 w-4" />
                  {transaction.nativeAddress && (
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground font-medium">
                        Native Address
                      </span>
                      <span className="font-mono">
                        {transaction.nativeAddress.slice(0, 6)}...
                        {transaction.nativeAddress.slice(-4)}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {transaction.nativeAddress && (
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground font-medium">
                        Native Address
                      </span>
                      <span className="font-mono">
                        {transaction.nativeAddress.slice(0, 6)}...
                        {transaction.nativeAddress.slice(-4)}
                      </span>
                    </div>
                  )}
                  <ArrowRight className="text-muted-foreground h-4 w-4" />
                  {transaction.baseAddress && (
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground font-medium">
                        Base Address
                      </span>
                      <span className="font-mono">
                        {transaction.baseAddress.slice(0, 6)}...
                        {transaction.baseAddress.slice(-4)}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Error details */}
          {transaction.errorMessage && (
            <div className="text-red-500">
              <div className="font-medium">Error:</div>
              <div className="text-muted-foreground mt-1 whitespace-pre-line text-xs">
                {formatErrorForUser(new Error(transaction.errorMessage))}
              </div>
              {transaction.errorStep && (
                <div className="text-muted-foreground mt-1 text-xs">
                  Failed at step {transaction.errorStep}
                </div>
              )}
            </div>
          )}

          {/* Recovered via EVM Recover indicator */}
          {transaction.recoveredViaEvmRecover && (
            <div className="flex items-center gap-2 text-green-500">
              <span className="text-xs">Recovered via EVM Recover</span>
            </div>
          )}

          {/* Explorer links */}
          {(transaction.step1TxHash || transaction.step2TxHash) && (
            <div className="space-y-2">
              <div className="text-muted-foreground text-xs font-medium">
                Transaction Details:
              </div>
              <div className="flex flex-wrap gap-2">
                {(() => {
                  const step1Hash = transaction.step1TxHash;
                  if (!step1Hash) return null;
                  return (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1 text-xs"
                      onClick={() => {
                        window.open(
                          getExplorerUrl(
                            step1Hash,
                            transaction.direction === "base-to-native"
                              ? "Base"
                              : "Torus Native",
                          ),
                          "_blank",
                          "noopener,noreferrer",
                        );
                      }}
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Step 1
                    </Button>
                  );
                })()}
                {(() => {
                  const step2Hash = transaction.step2TxHash;
                  if (!step2Hash) return null;
                  return (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1 text-xs"
                      onClick={() => {
                        window.open(
                          getExplorerUrl(step2Hash, "Torus EVM"),
                          "_blank",
                          "noopener,noreferrer",
                        );
                      }}
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Step 2
                    </Button>
                  );
                })()}
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
              <div>
                {getStatusBadge(
                  transaction.status,
                  transaction.recoveredViaEvmRecover,
                )}
              </div>

              <div className="text-muted-foreground">Date:</div>
              <div>{formatTimestamp(transaction.timestamp)}</div>
            </div>

            {transaction.errorMessage && (
              <div className="bg-muted/50 rounded-md p-3">
                <div className="text-sm font-medium text-red-500">Error:</div>
                <div className="text-muted-foreground mt-1 whitespace-pre-line text-xs">
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
