// Ensures that the multiProvider has been populated during the onRehydrateStorage hook
// otherwise returns undefined

import { useMemo } from "react";
import { useMultiProvider } from "./use-multi-provider";

export function useReadyMultiProvider() {
  const multiProvider = useMultiProvider();
  
  // Use useMemo to ensure we don't cause unnecessary re-renders
  return useMemo(() => {
    const chainNames = multiProvider.getKnownChainNames();
    if (!chainNames.length) return undefined;
    return multiProvider;
  }, [multiProvider]);
}
