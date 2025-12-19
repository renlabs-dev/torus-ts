"use client";

import { useCallback } from "react";

export function useFastBridgeTransactionUrlState() {
  const setTransactionInUrl = useCallback((txId: string) => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    params.set("txId", txId);
    const newUrl = `/fast?${params.toString()}`;
    window.history.replaceState(null, "", newUrl);
  }, []);

  const getTransactionFromUrl = useCallback(() => {
    // Read directly from window.location to get current URL state
    // This works correctly after F5 refresh
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    return params.get("txId");
  }, []);

  const clearTransactionFromUrl = useCallback(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    params.delete("txId");
    const newSearch = params.toString();
    const newUrl = `/fast${newSearch ? `?${newSearch}` : ""}`;
    window.history.replaceState(null, "", newUrl);
  }, []);

  return {
    setTransactionInUrl,
    getTransactionFromUrl,
    clearTransactionFromUrl,
  };
}
