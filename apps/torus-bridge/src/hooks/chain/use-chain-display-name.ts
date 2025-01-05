import type { ChainName } from "@hyperlane-xyz/sdk";
import { useMultiProvider } from "../use-multi-provider";
import { getChainDisplayName } from "~/utils/chain";

export function useChainDisplayName(chainName: ChainName, shortName = false) {
  const multiProvider = useMultiProvider();
  return getChainDisplayName(multiProvider, chainName, shortName);
}
