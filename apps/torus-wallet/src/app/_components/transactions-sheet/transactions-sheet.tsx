"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@torus-ts/ui/components/sheet";
import { useWallet } from "~/context/wallet-provider";
import { useTransactionsStore } from "~/store/transactions-store";
import { useUsdPrice } from "~/context/usd-price-provider";
import { Button } from "@torus-ts/ui/components/button";
import { Badge } from "@torus-ts/ui/components/badge";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";
import type { Transaction, TransactionType } from "~/store/transactions-store";
import { formatToken } from "@torus-network/torus-utils/subspace";
import { TransactionsSheetTrigger } from "./transactions-sheet-trigger";

const ITEMS_PER_PAGE = 10;
const BLOCK_EXPLORER_URL = "https://explorer.torus.network/tx/";

export function TransactionsSheet() {
  const { selectedAccount } = useWallet();
  const { usdPrice } = useUsdPrice();
  const getTransactionsByWallet = useTransactionsStore(
    (state) => state.getTransactionsByWallet,
  );

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalTransactions, setTotalTransactions] = useState(0);

  const loadTransactions = useCallback(() => {
    if (!selectedAccount?.address) {
      setTransactions([]);
      setTotalTransactions(0);
      setHasMore(false);
      return;
    }

    const result = getTransactionsByWallet(selectedAccount.address, {
      page,
      limit: ITEMS_PER_PAGE,
    });

    setTransactions((prev) =>
      page === 1 ? result.transactions : [...prev, ...result.transactions],
    );
    setTotalTransactions(result.total);
    setHasMore(result.hasMore);
  }, [selectedAccount?.address, getTransactionsByWallet, page]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const loadMoreTransactions = () => {
    if (hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  const getTransactionTypeDisplay = (type: TransactionType) => {
    switch (type) {
      case "stake":
        return "Stake";
      case "unstake":
        return "Unstake";
      case "send":
        return "Send";
      case "transfer-stake":
        return "Transfer Stake";
      default:
        return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            className="border-yellow-500 bg-transparent text-yellow-500 text-xs"
            aria-label="Transaction status: Pending"
          >
            Pending
          </Badge>
        );
      case "success":
        return (
          <Badge
            className="border-green-700 bg-transparent text-green-700 text-xs"
            aria-label="Transaction status: Success"
          >
            Success
          </Badge>
        );
      case "error":
        return (
          <Badge
            className="border-red-500 bg-transparent text-red-500 text-xs"
            aria-label="Transaction status: Failed"
          >
            Failed
          </Badge>
        );
      default:
        return (
          <Badge
            className="text-xs"
            aria-label={`Transaction status: ${status}`}
          >
            {status}
          </Badge>
        );
    }
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "MMM dd, HH:mm");
  };

  const shortenAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 5)}...${address.slice(-5)}`;
  };

  const formatAmount = (amount: string) => {
    try {
      return formatToken(BigInt(amount));
    } catch {
      return amount;
    }
  };

  return (
    <Sheet>
      <TransactionsSheetTrigger selectedAccount={selectedAccount?.address} />
      <SheetContent
        className="z-[70] w-[335px] flex h-full flex-col gap-4"
        aria-labelledby="transactions-sheet-title"
      >
        <SheetHeader>
          <SheetTitle
            id="transactions-sheet-title"
            className="text-lg font-semibold"
          >
            Transactions
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
          <div className="text-xs text-muted-foreground" aria-live="polite">
            {transactions.length} of {totalTransactions} transactions
          </div>

          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="rounded-lg border bg-card px-2 py-3 shadow-sm flex flex-col gap-2 text-sm"
                  role="region"
                  aria-label={`Transaction ${getTransactionTypeDisplay(tx.type)}`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-medium">
                      {getTransactionTypeDisplay(tx.type)}
                    </span>
                    {getStatusBadge(tx.status)}
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Amount</span>
                      <div
                        className="font-medium break-all"
                        aria-label={`Amount: ${formatAmount(tx.amount)}`}
                      >
                        {formatAmount(tx.amount)}
                        {usdPrice && (
                          <span className="text-muted-foreground ml-1">
                            ($
                            {(
                              Number(formatAmount(tx.amount)) * usdPrice
                            ).toFixed(2)}
                            )
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Fee</span>
                      <div
                        className="font-medium"
                        aria-label={`Fee: ${formatAmount(tx.fee)}`}
                      >
                        {formatAmount(tx.fee)}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date</span>
                      <div
                        className="font-medium"
                        aria-label={`Date: ${formatDate(tx.createdAt)}`}
                      >
                        {formatDate(tx.createdAt)}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-1">
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">From</span>
                        <div
                          className="font-mono text-xs"
                          aria-label={`From address: ${shortenAddress(tx.fromAddress)}`}
                        >
                          {shortenAddress(tx.fromAddress)}
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
                          aria-label={`To address: ${shortenAddress(tx.toAddress)}`}
                        >
                          {shortenAddress(tx.toAddress)}
                        </div>
                      </div>
                    </div>
                    {tx.hash && (
                      <div>
                        <a
                          href={`${BLOCK_EXPLORER_URL}${tx.hash}`}
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
              ))}
            </div>
          ) : (
            <div
              className="flex-1 flex items-center justify-center rounded-lg border bg-card
                text-muted-foreground text-sm"
              aria-live="polite"
            >
              No transactions found
            </div>
          )}
        </div>

        <SheetFooter>
          {hasMore && (
            <Button
              onClick={loadMoreTransactions}
              className="w-full text-sm"
              variant="outline"
              aria-label="Load more transactions"
            >
              Load More
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
