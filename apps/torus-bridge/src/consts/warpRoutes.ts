import { TokenStandard, WarpCoreConfig } from '@hyperlane-xyz/sdk';

// A list of Warp Route token configs
// These configs will be merged with the warp routes in the configured registry
// The input here is typically the output of the Hyperlane CLI warp deploy command
export const warpRouteConfigs: WarpCoreConfig = {
  tokens: [
    {
      chainName: 'torusalphanet',
      standard: TokenStandard.EvmHypNative,
      decimals: 18,
      symbol: 'TOR',
      name: 'TorusAlphanet',
      addressOrDenom: '0x7E39adE4c434b4a28e6b514A3AaBDf3e610752c2',
      logoURI: '/api/placeholder/400/300',
      connections: [
        {
          token: 'ethereum|torusalphanet|0xA893cc5bB7d89a961231Be8c7a1467476069b7D2',
        },
      ],
    },
    {
      chainName: 'holesky',
      standard: TokenStandard.EvmHypSynthetic,
      decimals: 18,
      symbol: 'ETH',
      name: 'Ether',
      addressOrDenom: '0x2a84b39fD6825BACCaE3644cEF7d0E23713e27E6',
      logoURI: '/api/placeholder/400/300',
      connections: [
        {
          token: 'ethereum|holesky|0x1921528bDf9891C27009fF6f1730ad9A7e1D298a',
        },
      ],
    },
  ],
  options: {},
};
