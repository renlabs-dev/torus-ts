"use client";

import { ArrowRight, Copy } from "lucide-react";
import { DateTime } from "luxon";
import { formatToken, smallAddress } from "@torus-network/torus-utils/subspace";
import type { Transaction, TransactionType } from "~/store/transactions-store";
import { TransactionStatusBadge } from "./transactions-item-status-badge";
import { getExplorerLink } from "node_modules/@torus-ts/torus-provider/src/_components/toast-content-handler";
import { env } from "~/env";
import { CopyButton } from "@torus-ts/ui/components/copy-button";
import { cn } from "@torus-ts/ui/lib/utils";

interface TransactionItemProps {
  transaction: Transaction;
  usdPrice: number | null;
  index?: number;
}

const mapStatusForBadge = (status: Transaction["status"]): "pending" | "success" | "error" => {
  if (status === "SUCCESS") return "success";
  if (status === "ERROR") return "error";
  return "pending";
};

export function TransactionItem({
  transaction,
  usdPrice,
}: TransactionItemProps) {
  const formatDate = (date: string) =>
    DateTime.fromISO(date).toFormat("MMM dd, HH:mm");

  const formatAmount = (amount: string) => {
    try {
      return formatToken(BigInt(amount));
    } catch {
      return amount;
    }
  };

  const getTransactionTypeDisplay = (type: TransactionType) =>
    ({
      all: "All",
      stake: "Stake",
      unstake: "Unstake",
      send: "Send",
      "transfer-stake": "Transfer Stake",
    })[type] || type;

  const amountUSD = usdPrice
    ? (Number(formatAmount(transaction.amount)) * usdPrice).toFixed(2)
    : "";

  const explorerLink = getExplorerLink({
    wsEndpoint: env("NEXT_PUBLIC_TORUS_RPC_URL"),
    hash: transaction.hash ?? "",
  });

  return (
    <div
      className="rounded-lg border bg-card p-2 shadow-sm flex flex-col gap-2 text-sm"
      role="region"
      aria-label={`Transaction ${getTransactionTypeDisplay(transaction.type)}`}
    >
      <div className="flex justify-between items-start">
        <span className="font-medium">
          {getTransactionTypeDisplay(transaction.type)}
        </span>
        <TransactionStatusBadge status={mapStatusForBadge(transaction.status)} />
      </div>
      <div className="grid grid-cols-1 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">Amount</span>
          <div
            className="font-medium break-all"
            aria-label={`Amount: ${formatAmount(transaction.amount)}`}
          >
            {formatAmount(transaction.amount)}
            {usdPrice && (
              <span className="text-muted-foreground ml-1">({amountUSD})</span>
            )}
          </div>
        </div>
        <div>
          <span className="text-muted-foreground">Fee</span>
          <div
            className="font-medium"
            aria-label={`Fee: ${formatAmount(transaction.fee)}`}
          >
            {formatAmount(transaction.fee)}
          </div>
        </div>
        <div>
          <span className="text-muted-foreground">Date</span>
          <div
            className="font-medium"
            aria-label={`Date: ${formatDate(transaction.createdAt)}`}
          >
            {formatDate(transaction.createdAt)}
          </div>
        </div>
        <div className="flex justify-between gap-2">
          <div className="flex flex-col">
            <span className="text-muted-foreground">From</span>
            <div
              className="font-mono text-xs"
              aria-label={`From address: ${transaction.fromAddress}`}
            >
              {smallAddress(transaction.fromAddress, 5)}
            </div>
          </div>
          <div className="flex justify-center items-center">
            <ArrowRight
              className="w-5 h-5 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-muted-foreground">To</span>
            <div
              className="font-mono text-xs"
              aria-label={`To address: ${transaction.toAddress}`}
            >
              {smallAddress(transaction.toAddress, 5)}
            </div>
          </div>
        </div>
        {transaction.hash && (
          <div className="space-y-2">
            <div>
              <span className="text-muted-foreground">Transaction Hash</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs" title={transaction.hash}>
                  {smallAddress(transaction.hash, 15)}
                </span>
                <CopyButton
                  copy={transaction.hash}
                  className={cn(
                    "h-fit p-0 text-muted-foreground hover:text-white",
                  )}
                  variant="ghost"
                >
                  <Copy size={17} />
                </CopyButton>
              </div>
            </div>
            <div>
              <a
                href={explorerLink}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-blue-500 hover:underline block"
                aria-label="View transaction in block explorer"
              >
                View in block explorer
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
