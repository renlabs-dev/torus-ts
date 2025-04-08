import type { ChainName } from "@hyperlane-xyz/sdk";
import { useChainMetadata } from "./use-chain-metadata";

export function useChainProtocol(chainName?: ChainName) {
  const metadata = useChainMetadata(chainName);
  return metadata?.protocol;
}
