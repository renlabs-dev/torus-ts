"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@torus-ts/ui/components/sheet";
import { useWallet } from "~/context/wallet-provider";
import { useTransactionsStore } from "~/store/transactions-store";
import { useUsdPrice } from "~/context/usd-price-provider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@torus-ts/ui/components/table";
import { Button } from "@torus-ts/ui/components/button";
import { Badge } from "@torus-ts/ui/components/badge";
import { format } from "date-fns";
import type { Transaction, TransactionType } from "~/store/transactions-store";
import { formatToken } from "@torus-network/torus-utils/subspace";
import { TransactionsSheetTrigger } from "./transactions-sheet-trigger";

const ITEMS_PER_PAGE = 10;

export function TransactionsSheet() {
  const { selectedAccount } = useWallet();
  const { usdPrice } = useUsdPrice();

  const getTransactionsByWallet = useTransactionsStore(
    (state) =>
      (...args: Parameters<typeof state.getTransactionsByWallet>) =>
        state.getTransactionsByWallet(...args),
  );

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [isInitialRender, setIsInitialRender] = useState(true);

  const loadTransactions = useCallback(() => {
    if (!selectedAccount?.address) return [];

    const result = getTransactionsByWallet(selectedAccount.address, {
      page,
      limit: ITEMS_PER_PAGE,
    });

    if (page === 1) {
      setTransactions(result.transactions);
    } else {
      setTransactions((prev) => [...prev, ...result.transactions]);
    }

    setTotalTransactions(result.total);
    setHasMore(result.hasMore);
  }, [selectedAccount?.address, getTransactionsByWallet, page]);

  // Initial load effect
  useEffect(() => {
    if (isInitialRender) {
      setIsInitialRender(false);
      loadTransactions();
    }
  }, [isInitialRender, loadTransactions]);

  // Effect for pagination
  useEffect(() => {
    if (!isInitialRender && page > 1) {
      loadTransactions();
    }
  }, [page, loadTransactions, isInitialRender]);

  const loadMoreTransactions = () => {
    if (hasMore) {
      setPage((prevPage) => prevPage + 1);
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
        return <Badge className="bg-yellow-100">Pending</Badge>;
      case "success":
        return <Badge className="bg-green-100">Success</Badge>;
      case "failed":
        return <Badge className="bg-red-100">Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (date: string) => {
    return format(new Date(date), "PPp");
  };

  const shortenAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const formatAmount = (amount: string) => {
    try {
      return formatToken(BigInt(amount));
    } catch (error) {
      // If we can't convert to BigInt, just return the amount as a string
      return amount;
    }
  };

  console.log("transactions", transactions);

  return (
    <Sheet>
      <TransactionsSheetTrigger selectedAccount={selectedAccount?.address} />
      <SheetContent className="z-[70] flex h-full flex-col justify-between gap-8 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Transactions</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Transaction count */}
          <div className="mb-4 text-sm text-muted-foreground">
            Showing {transactions.length} of {totalTransactions} transactions
          </div>

          {/* Transactions table */}
          {transactions.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        {getTransactionTypeDisplay(tx.type)}
                      </TableCell>
                      <TableCell>{formatDate(tx.createdAt)}</TableCell>
                      <TableCell className="font-mono">
                        {shortenAddress(tx.fromAddress)}
                      </TableCell>
                      <TableCell className="font-mono">
                        {shortenAddress(tx.toAddress)}
                      </TableCell>
                      <TableCell>
                        <div>{formatAmount(tx.amount)}</div>
                        <div className="text-xs text-muted-foreground">
                          {usdPrice
                            ? `$${(Number(formatAmount(tx.amount)) * usdPrice).toFixed(2)}`
                            : ""}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(tx.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center rounded-md border">
              <p className="text-center text-muted-foreground">
                No transactions found
              </p>
            </div>
          )}
        </div>

        {/* Load more button */}
        {hasMore && (
          <div className="mt-4 flex justify-center">
            <Button onClick={loadMoreTransactions}>Load More</Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
