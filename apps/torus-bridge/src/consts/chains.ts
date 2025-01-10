import { z } from "zod";

import type { ChainMap, ChainMetadata } from "@hyperlane-xyz/sdk";
import { ExplorerFamily } from "@hyperlane-xyz/sdk";
import type { Address } from "@hyperlane-xyz/utils";
import { ProtocolType } from "@hyperlane-xyz/utils";

export const chainsTS: ChainMap<ChainMetadata & { mailbox?: Address }> = {
  torustestnet: {
    protocol: ProtocolType.Ethereum,
    chainId: 21001,
    domainId: 21001,
    isTestnet: true,
    name: "torustestnet",
    displayName: "Torus Testnet",
    nativeToken: { name: "torustestnet", symbol: "TORUS", decimals: 18 },
    rpcUrls: [
      {
        http: "https://api.testnet.torus.network",
      },
    ],
    blocks: {
      confirmations: 1,
      reorgPeriod: "finalized",
      estimateBlockTime: 8,
    },
    blockExplorers: [
      {
        name: "Torus Testnet Blockscout",
        family: ExplorerFamily.Blockscout,
        url: "https://blockscout.testnet.torus.network",
        apiUrl: "https://api.blockscout.testnet.torus.network/api",
      },
    ],
    logoURI: "/logo.svg",
  },
};
