import type { ChainName } from "@hyperlane-xyz/sdk";

import { useMultiProvider } from "../use-multi-provider";

export function useChainMetadata(chainName?: ChainName) {
  const multiProvider = useMultiProvider();
  if (!chainName) return undefined;
  return multiProvider.tryGetChainMetadata(chainName);
}
