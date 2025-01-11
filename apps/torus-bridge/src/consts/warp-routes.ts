import type { WarpCoreConfig } from "@hyperlane-xyz/sdk";
import { TokenStandard } from "@hyperlane-xyz/sdk";

// A list of Warp Route token configs
// These configs will be merged with the warp routes in the configured registry
// The input here is typically the output of the Hyperlane CLI warp deploy command
export const WarpRoutesTs: WarpCoreConfig = {
  tokens: [
    {
      chainName: "base",
      standard: TokenStandard.EvmHypSynthetic,
      decimals: 18,
      symbol: "ETH",
      name: "Base",
      addressOrDenom: "0x78EC15C5FD8EfC5e924e9EEBb9e549e29C785867",
      connections: [
        {
          token: "ethereum|torus|0x9925CdbeA5B91542bbA6e1fc967465b1C1ED7156",
        },
      ],
    },
    {
      chainName: "torus",
      standard: TokenStandard.EvmHypNative,
      decimals: 18,
      symbol: "TORUS",
      name: "Torus EVM",
      addressOrDenom: "0x9925CdbeA5B91542bbA6e1fc967465b1C1ED7156",
      connections: [
        {
          token: "ethereum|base|0x78EC15C5FD8EfC5e924e9EEBb9e549e29C785867",
        },
      ],
    },
  ],
  options: {},
};
