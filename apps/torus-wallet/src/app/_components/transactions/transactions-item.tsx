"use client";

import { smallAddress } from "@torus-network/torus-utils/torus/address";
import { formatToken } from "@torus-network/torus-utils/torus/token";
import { getExplorerLink } from "@torus-ts/torus-provider/use-send-transaction";
import { CopyButton } from "@torus-ts/ui/components/copy-button";
import { cn } from "@torus-ts/ui/lib/utils";
import { env } from "~/env";
import type { Transaction, TransactionType } from "~/store/transactions-store";
import { ArrowRight, Copy } from "lucide-react";
import { DateTime } from "luxon";
import { TransactionStatusBadge } from "./transactions-item-status-badge";

interface TransactionItemProps {
  transaction: Transaction;
  usdPrice: number | null;
  index?: number;
}

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
    blockHash: transaction.hash ?? "",
  });

  return (
    <div
      className="bg-card flex flex-col gap-2 rounded-lg border p-3 text-sm shadow-sm"
      role="region"
      aria-label={`Transaction ${getTransactionTypeDisplay(transaction.type)}`}
    >
      <div className="flex items-start justify-between">
        <span className="font-medium">
          {getTransactionTypeDisplay(transaction.type)}
        </span>
        <TransactionStatusBadge status={transaction.status} />
      </div>
      <div className="grid grid-cols-1 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">Amount</span>
          <div
            className="break-all font-medium"
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
          <div className="flex items-center justify-center">
            <ArrowRight
              className="text-muted-foreground h-5 w-5"
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
                    "text-muted-foreground h-fit p-0 hover:text-white",
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
                className="block font-mono text-xs text-blue-500 hover:underline"
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
