import type { WarpCoreConfig } from "@hyperlane-xyz/sdk";
import { TokenStandard } from "@hyperlane-xyz/sdk";

// A list of Warp Route token configs
// These configs will be merged with the warp routes in the configured registry
// The input here is typically the output of the Hyperlane CLI warp deploy command
export const WarpRoutesTs: WarpCoreConfig = {
  tokens: [
    {
      chainName: "basesepolia",
      standard: TokenStandard.EvmHypSynthetic,
      decimals: 18,
      symbol: "TORUS",
      name: "torustestnet",
      addressOrDenom: "0x0Aa8515D2d85a345C01f79506cF5941C65DdABb9",
      connections: [
        {
          token:
            "ethereum|torustestnet|0x10461F4F54229155F5C21554dE1e1a682Ca236E9",
        },
      ],
    },
    {
      chainName: "torustestnet",
      standard: TokenStandard.EvmHypNative,
      decimals: 18,
      symbol: "TORUS",
      name: "torustestnet",
      addressOrDenom: "0x10461F4F54229155F5C21554dE1e1a682Ca236E9",
      connections: [
        {
          token:
            "ethereum|basesepolia|0x0Aa8515D2d85a345C01f79506cF5941C65DdABb9",
        },
      ],
    },
  ],
  options: {},
};
