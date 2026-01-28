"use client";

import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { Badge } from "@torus-ts/ui/components/badge";
import { Button } from "@torus-ts/ui/components/button";
import { Checkbox } from "@torus-ts/ui/components/checkbox";
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
  Loader,
  Play,
  RotateCw,
} from "lucide-react";
import { useState } from "react";
import {
  EXPLORER_URLS,
  formatErrorForUser,
} from "../hooks/fast-bridge-helpers";
import { fetchHyperlaneExplorerUrl } from "../lib/hyperlane-graphql";
import type { FastBridgeTransactionHistoryItem } from "./fast-bridge-types";

interface TransactionHistoryItemProps {
  transaction: FastBridgeTransactionHistoryItem;
  index: number;
  onContinue: (transaction: FastBridgeTransactionHistoryItem) => void;
  isMultiSelectMode?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (transactionId: string, selected: boolean) => void;
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
      <Badge
        variant="outline"
        className="border-green-500 text-green-500"
        data-testid="status-recovered"
      >
        Recovered
      </Badge>
    );
  }

  switch (status) {
    case "completed":
      return (
        <Badge
          variant="outline"
          className="border-green-500 text-green-500"
          data-testid="status-success"
        >
          Success
        </Badge>
      );
    case "error":
      return (
        <Badge
          variant="outline"
          className="border-red-500 text-red-500"
          data-testid="status-error"
        >
          Error
        </Badge>
      );
    case "step1_complete":
      return (
        <Badge
          variant="outline"
          className="border-yellow-500 text-yellow-500"
          data-testid="status-step1-complete"
        >
          Step 1 Complete
        </Badge>
      );
    case "pending":
      return (
        <Badge
          variant="outline"
          className="border-yellow-500 text-yellow-500"
          data-testid="status-pending"
        >
          Pending
        </Badge>
      );
  }
}

export function TransactionHistoryItem({
  transaction,
  index,
  onContinue,
  isMultiSelectMode = false,
  isSelected = false,
  onSelectionChange,
}: TransactionHistoryItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoadingMsgId, setIsLoadingMsgId] = useState(false);
  const [cachedExplorerUrl, setCachedExplorerUrl] = useState<string | null>(
    null,
  );

  const directionLabel =
    transaction.direction === "base-to-native"
      ? "Base → Torus"
      : "Torus → Base";

  const canExpand =
    transaction.status === "completed" ||
    transaction.status === "error" ||
    transaction.status === "pending" ||
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    transaction.status === "step1_complete" ||
    transaction.recoveredViaEvmRecover;

  const handleCardClick = () => {
    if (isMultiSelectMode) {
      handleSelectionChange(!isSelected);
    } else if (canExpand) {
      setIsExpanded((prev) => !prev);
    }
  };

  const handleContinue = () => {
    onContinue(transaction);
  };

  const handleSelectionChange = (checked: boolean) => {
    onSelectionChange?.(transaction.id, checked);
  };

  const openExplorerUrl = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const getStep1ExplorerUrl = (txHash: string, chainName: string): string => {
    const chain = chainName.toLowerCase();
    if (chain === "base") {
      return `${EXPLORER_URLS.BASE}/${txHash}`;
    }
    if (chain === "torus") {
      return `${EXPLORER_URLS.TORUS}${txHash}`;
    }
    return "";
  };

  const handleOpenExplorer = async (
    txHash: string | undefined,
    chainName: string,
    step: 1 | 2,
  ) => {
    if (!txHash) return;

    // Step 1: Direct explorer links
    if (step === 1) {
      const explorerUrl = getStep1ExplorerUrl(txHash, chainName);
      if (explorerUrl) {
        openExplorerUrl(explorerUrl);
      }
      return;
    }

    // Step 2: Hyperlane explorer with msg_id lookup
    if (cachedExplorerUrl) {
      openExplorerUrl(cachedExplorerUrl);
      return;
    }

    setIsLoadingMsgId(true);
    const [error, explorerUrl] = await tryAsync(
      fetchHyperlaneExplorerUrl(txHash),
    );
    setIsLoadingMsgId(false);

    if (error === undefined && explorerUrl) {
      setCachedExplorerUrl(explorerUrl);
      openExplorerUrl(explorerUrl);
    }
  };

  const isBaseToNative = transaction.direction === "base-to-native";
  const fromAddress = isBaseToNative
    ? transaction.baseAddress
    : transaction.nativeAddress;
  const toAddress = isBaseToNative
    ? transaction.nativeAddress
    : transaction.baseAddress;
  const fromChain = isBaseToNative ? "Base Chain" : "Torus Chain";
  const toChain = isBaseToNative ? "Torus Chain" : "Base Chain";
  const step1Chain = isBaseToNative ? "Base" : "Torus";
  const step2Chain = isBaseToNative ? "Torus EVM" : "Base";

  return (
    <div
      className={cn(
        "border-border bg-card rounded-lg border p-4",
        isMultiSelectMode && "cursor-pointer",
      )}
      onClick={isMultiSelectMode ? handleCardClick : undefined}
    >
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex flex-1 items-center gap-3",
            !isMultiSelectMode && canExpand && "cursor-pointer",
          )}
          onClick={!isMultiSelectMode ? handleCardClick : undefined}
        >
          {isMultiSelectMode && (
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => {
                handleSelectionChange(!!checked);
              }}
              onClick={(e) => e.stopPropagation()}
              className="shrink-0"
            />
          )}
          <Badge
            variant="secondary"
            className="text-muted-foreground shrink-0 font-mono text-xs"
            data-testid={`transaction-index-${index + 1}`}
          >
            #{index + 1}
          </Badge>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span
                className="text-sm font-medium"
                data-testid="transaction-direction"
              >
                {directionLabel}
              </span>
              <span data-testid="transaction-status">
                {getStatusBadge(
                  transaction.status,
                  transaction.recoveredViaEvmRecover,
                )}
              </span>
            </div>
            <div
              className="text-muted-foreground mt-1 text-sm"
              data-testid="transaction-amount"
            >
              {transaction.amount} TORUS
            </div>
            <div
              className="text-muted-foreground mt-1 text-xs"
              data-testid="transaction-timestamp"
            >
              {formatTimestamp(transaction.timestamp)}
            </div>
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
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleContinue();
                    }}
                  >
                    <RotateCw className="mr-2 h-4 w-4" />
                    Retry
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p className="text-xs">Retry this failed transaction</p>
                </TooltipContent>
              </Tooltip>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="h-8 w-8 p-0"
              disabled={isMultiSelectMode}
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
        <div className="bg-muted/50 mt-4 space-y-4 rounded-md p-4 text-sm">
          {/* Address details */}
          {(transaction.baseAddress || transaction.nativeAddress) && (
            <div className="space-y-3">
              <div
                className="text-muted-foreground text-xs font-medium"
                data-testid="transaction-flow-title"
              >
                Transaction Flow
              </div>
              <div className="flex items-center gap-4">
                {fromAddress && (
                  <div className="bg-background border-border flex flex-1 flex-col gap-2 rounded-lg border p-3">
                    <div
                      className="text-muted-foreground text-xs font-medium"
                      data-testid="from-chain-label"
                    >
                      {fromChain}
                    </div>
                    <div className="bg-muted/50 border-border flex items-center justify-between rounded border px-2 py-1.5">
                      <span
                        className="font-mono text-xs"
                        data-testid="from-chain-address"
                      >
                        {fromAddress.slice(0, 8)}...
                        {fromAddress.slice(-6)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Use blockHash for Polkadot explorer (if available), otherwise fallback to txHash
                          const hashForExplorer =
                            step1Chain === "Torus"
                              ? transaction.step1BlockHash ||
                                transaction.step1TxHash
                              : transaction.step1TxHash;
                          void handleOpenExplorer(
                            hashForExplorer,
                            step1Chain,
                            1,
                          );
                        }}
                        disabled={!transaction.step1TxHash}
                        data-testid="external-link-icon"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
                <ArrowRight className="text-muted-foreground h-5 w-5 shrink-0" />
                {toAddress && (
                  <div className="bg-background border-border flex flex-1 flex-col gap-2 rounded-lg border p-3">
                    <div
                      className="text-muted-foreground text-xs font-medium"
                      data-testid="to-chain-label"
                    >
                      {toChain}
                    </div>
                    <div className="bg-muted/50 border-border flex items-center justify-between rounded border px-2 py-1.5">
                      <span
                        className="font-mono text-xs"
                        data-testid="to-chain-address"
                      >
                        {toAddress.slice(0, 8)}...
                        {toAddress.slice(-6)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleOpenExplorer(
                            isBaseToNative
                              ? transaction.step1TxHash
                              : transaction.step2TxHash,
                            step2Chain,
                            2,
                          );
                        }}
                        disabled={
                          (isBaseToNative
                            ? !transaction.step1TxHash
                            : !transaction.step2TxHash) || isLoadingMsgId
                        }
                        data-testid="external-link-icon"
                      >
                        {isLoadingMsgId ? (
                          <Loader className="h-3 w-3 animate-spin" />
                        ) : (
                          <ExternalLink className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error details */}
          {transaction.errorMessage && (
            <div className="text-red-500" data-testid="error-message">
              <div className="font-medium" data-testid="error-title">
                Error:
              </div>
              <div
                className="text-muted-foreground mt-1 whitespace-pre-line text-xs"
                data-testid="error-details"
              >
                {formatErrorForUser(new Error(transaction.errorMessage))}
              </div>
              {transaction.errorStep && (
                <div
                  className="text-muted-foreground mt-1 text-xs"
                  data-testid="error-step"
                >
                  Failed at step {transaction.errorStep}
                </div>
              )}
            </div>
          )}

          {/* Recovered via EVM Recover indicator */}
          {transaction.recoveredViaEvmRecover && (
            <div
              className="flex items-center gap-2 text-green-500"
              data-testid="recovered-message"
            >
              <span className="text-xs">Recovered via EVM Recover</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
