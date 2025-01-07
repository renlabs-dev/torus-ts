import type { ChainMap, ChainMetadata } from "@hyperlane-xyz/sdk";
import type { Address } from "@hyperlane-xyz/utils";
import { ProtocolType } from "@hyperlane-xyz/utils";

export const chainsTS: ChainMap<ChainMetadata & { mailbox?: Address }> = {
  torustestnet: {
    protocol: ProtocolType.Ethereum,
    chainId: 21000,
    domainId: 21000,
    name: "torustestnet",
    displayName: "TorusTestnet",
    nativeToken: { name: "tours", symbol: "TORUS", decimals: 18 },
    // eslint-disable-next-line no-restricted-properties
    rpcUrls: [{ http: String(process.env.NEXT_PUBLIC_TORUS_RPC_HTTPS_URL) }],
    blocks: {
      confirmations: 1,
      reorgPeriod: "finalized",
      estimateBlockTime: 8,
    },
    logoURI: "/logo.svg",
  },
};
