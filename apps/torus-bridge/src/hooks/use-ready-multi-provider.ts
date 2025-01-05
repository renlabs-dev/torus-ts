// Ensures that the multiProvider has been populated during the onRehydrateStorage hook above,

import { useMultiProvider } from "./use-multi-provider";

// otherwise returns undefined
export function useReadyMultiProvider() {
  const multiProvider = useMultiProvider();
  if (!multiProvider.getKnownChainNames().length) return undefined;
  return multiProvider;
}
