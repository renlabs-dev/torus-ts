"use client";

import { ArrowRight } from "lucide-react";
import { DateTime } from "luxon";
import { formatToken } from "@torus-network/torus-utils/subspace";
import type { Transaction, TransactionType } from "~/store/transactions-store";
import { TransactionStatusBadge } from "./transactions-item-status-badge";

const BLOCK_EXPLORER_URL = "https://explorer.torus.network/tx/";

interface TransactionItemProps {
  transaction: Transaction;
  usdPrice: number | null;
}

export function TransactionItem({
  transaction,
  usdPrice,
}: TransactionItemProps) {
  const formatDate = (date: string) =>
    DateTime.fromISO(date).toFormat("MMM dd, HH:mm");
  const shortenAddress = (address: string) =>
    address ? `${address.slice(0, 5)}...${address.slice(-5)}` : "";
  const formatAmount = (amount: string) => {
    try {
      return formatToken(BigInt(amount));
    } catch {
      return amount;
    }
  };

  const getTransactionTypeDisplay = (type: TransactionType) =>
    ({
      stake: "Stake",
      unstake: "Unstake",
      send: "Send",
      "transfer-stake": "Transfer Stake",
    })[type] || type;

  return (
    <div
      className="rounded-lg border bg-card p-4 shadow-sm flex flex-col gap-2 text-sm"
      role="region"
      aria-label={`Transaction ${getTransactionTypeDisplay(transaction.type)}`}
    >
      <div className="flex justify-between items-start">
        <span className="font-medium">
          {getTransactionTypeDisplay(transaction.type)}
        </span>
        <TransactionStatusBadge status={transaction.status} />
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
              <span className="text-muted-foreground ml-1">
                ($
                {(Number(formatAmount(transaction.amount)) * usdPrice).toFixed(
                  2,
                )}
                )
              </span>
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
              aria-label={`From address: ${shortenAddress(transaction.fromAddress)}`}
            >
              {shortenAddress(transaction.fromAddress)}
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
              aria-label={`To address: ${shortenAddress(transaction.toAddress)}`}
            >
              {shortenAddress(transaction.toAddress)}
            </div>
          </div>
        </div>
        {transaction.hash && (
          <div>
            <a
              href={`${BLOCK_EXPLORER_URL}${transaction.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xs text-blue-500 hover:underline block"
              aria-label="View transaction in block explorer"
            >
              View in block explorer
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
