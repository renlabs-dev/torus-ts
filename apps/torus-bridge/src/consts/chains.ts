import { z } from "zod";

import type { ChainMap, ChainMetadata } from "@hyperlane-xyz/sdk";
import { ExplorerFamily } from "@hyperlane-xyz/sdk";
import type { Address } from "@hyperlane-xyz/utils";
import { ProtocolType } from "@hyperlane-xyz/utils";

export const chainsTS: ChainMap<ChainMetadata & { mailbox?: Address }> = {
  torus: {
    protocol: ProtocolType.Ethereum,
    chainId: 21000,
    domainId: 21000,
    isTestnet: false,
    name: "torus",
    displayName: "Torus",
    nativeToken: { name: "torus", symbol: "TORUS", decimals: 18 },
    rpcUrls: [
      {
        http: "https://api.torus.network",
      },
    ],
    blocks: {
      confirmations: 1,
      reorgPeriod: "finalized",
      estimateBlockTime: 8,
    },
    blockExplorers: [
      {
        name: "Torus Mainnet Blockscout",
        family: ExplorerFamily.Blockscout,
        url: "https://blockscout.torus.network",
        apiUrl: "https://api.blockscout.torus.network/api",
      },
    ],
    logoURI: "/logo.svg",
  },
};
