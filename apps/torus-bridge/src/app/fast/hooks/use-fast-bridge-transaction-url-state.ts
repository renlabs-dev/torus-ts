"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function useFastBridgeTransactionUrlState() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const setTransactionInUrl = useCallback(
    (txId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("txId", txId);
      router.push(`/fast?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const getTransactionFromUrl = useCallback(() => {
    return searchParams.get("txId");
  }, [searchParams]);

  const clearTransactionFromUrl = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("txId");
    const newSearch = params.toString();
    router.push(`/fast${newSearch ? `?${newSearch}` : ""}`, { scroll: false });
  }, [router, searchParams]);

  return {
    setTransactionInUrl,
    getTransactionFromUrl,
    clearTransactionFromUrl,
  };
}
