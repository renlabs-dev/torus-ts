"use client";

import { useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export function useTabWithQueryParam(defaultTab: string = "dashboard") {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tab = searchParams.get("tab") ?? defaultTab;

  const handleTabChange = useCallback(
    (value: string) => {
      // If the current tab is already the requested tab, do nothing
      if (value === tab) {
        return;
      }
      
      const params = new URLSearchParams(searchParams.toString());

      if (value === defaultTab) {
        params.delete("tab");
      } else {
        params.set("tab", value);
      }

      const newQuery = params.toString();
      const queryString = newQuery ? `?${newQuery}` : "";

      router.push(`/dao-dashboard${queryString}`);
    },
    [searchParams, router, defaultTab, tab],
  );

  useEffect(() => {
    // If no tab is specified in URL but we're at the page, set the default tab
    if (!searchParams.has("tab")) {
      // Only update if we need to (avoid unnecessary navigation)
      if (tab !== defaultTab) {
        handleTabChange(defaultTab);
      }
    }
  }, [searchParams, handleTabChange, tab, defaultTab]);

  return { tab, handleTabChange };
}
