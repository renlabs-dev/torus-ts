import type { ChainName } from "@hyperlane-xyz/sdk";

import { getChainDisplayName } from "~/utils/chain";

import { useMultiProvider } from "../use-multi-provider";

export function useChainDisplayName(chainName: ChainName, shortName = false) {
  const multiProvider = useMultiProvider();
  return getChainDisplayName(multiProvider, chainName, shortName);
}
