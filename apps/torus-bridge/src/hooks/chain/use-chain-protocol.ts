import { useChainMetadata } from "./use-chain-metadata";
import type { ChainName } from "@hyperlane-xyz/sdk";

export function useChainProtocol(chainName?: ChainName) {
  const metadata = useChainMetadata(chainName);
  return metadata?.protocol;
}
