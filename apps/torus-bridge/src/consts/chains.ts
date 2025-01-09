import type { ChainMap, ChainMetadata } from "@hyperlane-xyz/sdk";
import { ExplorerFamily } from "@hyperlane-xyz/sdk";
import type { Address } from "@hyperlane-xyz/utils";
import { ProtocolType } from "@hyperlane-xyz/utils";

export const chainsTS: ChainMap<ChainMetadata & { mailbox?: Address }> = {
  torustestnet: {
    protocol: ProtocolType.Ethereum,
    chainId: 21001,
    domainId: 21001,
    name: "torustestnet",
    displayName: "TorusTestnet",
    nativeToken: { name: "torus", symbol: "TORUS", decimals: 18 },
    // eslint-disable-next-line no-restricted-properties
    rpcUrls: [{ http: String(process.env.NEXT_PUBLIC_TORUS_RPC_HTTPS_URL) }],
    blocks: {
      confirmations: 1,
      reorgPeriod: "finalized",
      estimateBlockTime: 8,
    },
    blockExplorers: [
      {
        name: "Blockscout",
        family: ExplorerFamily.Etherscan,
        url: "https://blockscout.testnet.torus.network",
        apiUrl: "https://api.blockscout.testnet.torus.network/api",
        // apiKey: "https://api.blockscout.testnet.torus.network/api",
      },
    ],
    logoURI: "/logo.svg",
  },
};
