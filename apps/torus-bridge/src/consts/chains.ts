import { ChainMap, ChainMetadata } from '@hyperlane-xyz/sdk';
import { ProtocolType } from '@hyperlane-xyz/utils';

export const chains: ChainMap<ChainMetadata & { mailbox?: Address }> = {
  torusalphanet: {
    protocol: ProtocolType.Ethereum,
    chainId: 21000,
    domainId: 21000,
    name: 'torusalphanet',
    displayName: 'TorusAlphanet',
    nativeToken: { name: 'torusalphanet', symbol: 'TOR', decimals: 18 },
    rpcUrls: [{ http: String(process.env.NEXT_PUBLIC_WS_PROVIDER) }],
    blocks: {
      confirmations: 1,
      reorgPeriod: 1,
      estimateBlockTime: 8,
    },
    logoURI: '/torus/logo.svg',
  },
};
