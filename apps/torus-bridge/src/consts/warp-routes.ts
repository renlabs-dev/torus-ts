import type { WarpCoreConfig } from "@hyperlane-xyz/sdk";
import { TokenStandard } from "@hyperlane-xyz/sdk";

// A list of Warp Route token configs
// These configs will be merged with the warp routes in the configured registry
// The input here is typically the output of the Hyperlane CLI warp deploy command
export const WarpRoutesTs: WarpCoreConfig = {
  tokens: [
    {
      chainName: "torustestnet",
      standard: TokenStandard.EvmHypNative,
      decimals: 18,
      symbol: "TORUS",
      name: "TorusTestnet",
      addressOrDenom: "0x677723050085BFE889726B58a14418a92cBF7f36",
      logoURI: "/api/placeholder/400/300",
      connections: [
        {
          token:
            "ethereum|torustestnet|0x677723050085BFE889726B58a14418a92cBF7f36",
        },
      ],
    },
    {
      chainName: "basesepolia",
      standard: TokenStandard.EvmHypSynthetic,
      decimals: 18,
      symbol: "ETH",
      name: "Ether",
      addressOrDenom: "0x1c87f74D6E39F567cB1aac0e091Dc433a702ABd7",
      logoURI: "/api/placeholder/400/300",
      connections: [
        {
          token:
            "ethereum|basesepolia|0x1c87f74D6E39F567cB1aac0e091Dc433a702ABd7",
        },
      ],
    },
  ],
  options: {},
};
