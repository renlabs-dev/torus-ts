"use client";

import { useSearchParams } from "next/navigation";
import { useCallback } from "react";

export function useFastBridgeTransactionUrlState() {
  const searchParams = useSearchParams();

  const setTransactionInUrl = useCallback(
    (txId: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("txId", txId);
      const newUrl = `/fast?${params.toString()}`;
      window.history.replaceState(null, "", newUrl);
    },
    [searchParams],
  );

  const getTransactionFromUrl = useCallback(() => {
    return searchParams.get("txId");
  }, [searchParams]);

  const clearTransactionFromUrl = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("txId");
    const newSearch = params.toString();
    const newUrl = `/fast${newSearch ? `?${newSearch}` : ""}`;
    window.history.replaceState(null, "", newUrl);
  }, [searchParams]);

  return {
    setTransactionInUrl,
    getTransactionFromUrl,
    clearTransactionFromUrl,
  };
}
