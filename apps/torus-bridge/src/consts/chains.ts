import type { ChainMap, ChainMetadata } from "@hyperlane-xyz/sdk";
import type { Address } from "@hyperlane-xyz/utils";
import { ProtocolType } from "@hyperlane-xyz/utils";

export const chainsTS: ChainMap<ChainMetadata & { mailbox?: Address }> = {
  torusalphanet: {
    protocol: ProtocolType.Ethereum,
    chainId: 21000,
    domainId: 21000,
    name: "torusalphanet",
    displayName: "TorusAlphanet",
    nativeToken: { name: "torusalphanet", symbol: "TOR", decimals: 18 },
    // eslint-disable-next-line no-restricted-properties
    rpcUrls: [{ http: String(process.env.NEXT_PUBLIC_TORUS_RPC_URL) }],
    blocks: {
      confirmations: 1,
      reorgPeriod: 1,
      estimateBlockTime: 8,
    },
    logoURI: "/torus/logo.svg",
  },
};
