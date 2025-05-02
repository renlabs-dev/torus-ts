"use client";

import { useEffect, useState } from "react";
import type { transactionHistorySchema } from "@torus-ts/db/schema";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@torus-ts/api";
import { api } from "~/utils/api";

type RouterOutput = inferRouterOutputs<AppRouter>;
type TransactionHistoryRecord = typeof transactionHistorySchema.$inferSelect;
type TransactionHistoryResponse = RouterOutput["transactionHistory"]["byUser"];

export function useTransactionHistory(address: string) {
  const [page, setPage] = useState(1);
  const limit = 50;
  
  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = api.transactionHistory.byUser.useQuery(
    { 
      userKey: address, 
      page, 
      limit 
    },
    { 
      enabled: !!address,
      keepPreviousData: true
    }
  );
  
  const transactions = data?.transactions || [];
  const pagination = data?.pagination;
  
  const loadMore = () => {
    if (pagination && pagination.hasMore) {
      setPage(prev => prev + 1);
    }
  };
  
  return {
    transactions,
    pagination,
    isLoading,
    error,
    refetch,
    loadMore
  };
}