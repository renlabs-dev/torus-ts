import { ChakraProvider } from "@chakra-ui/react";
import { GasPrice } from "@cosmjs/stargate";
import { wallets as cosmostationWallets } from "@cosmos-kit/cosmostation";
import { wallets as keplrWallets } from "@cosmos-kit/keplr";
import { wallets as leapWallets } from "@cosmos-kit/leap";
import { ChainProvider } from "@cosmos-kit/react";
import { cosmoshub } from "@hyperlane-xyz/registry";
import { MultiProtocolProvider } from "@hyperlane-xyz/sdk";
import { getCosmosKitChainConfigs } from "@hyperlane-xyz/widgets";
import "@interchain-ui/react/styles";
import type { PropsWithChildren } from "react";
import { useMemo } from "react";

import { config } from "../consts/config";
import { useMultiProvider } from "../features/chains/hooks";

export function CosmosWalletProvider({ children }: PropsWithChildren<unknown>) {
  const chainMetadata = useMultiProvider().metadata;
  const { chains, assets } = useMemo(() => {
    const multiProvider = new MultiProtocolProvider({
      ...chainMetadata,
      cosmoshub,
    });
    return getCosmosKitChainConfigs(multiProvider);
  }, [chainMetadata]);
  const leapWithoutSnap = leapWallets.filter(
    (wallet) => !wallet.walletName.includes("snap"),
  );
  // TODO replace Chakra here with a custom modal for ChainProvider
  // Using Chakra + @cosmos-kit/react instead of @cosmos-kit/react-lite adds about 600Kb to the bundle
  return (
    <ChakraProvider>
      <ChainProvider
        chains={chains}
        assetLists={assets}
        wallets={[...keplrWallets, ...cosmostationWallets, ...leapWithoutSnap]}
        walletConnectOptions={{
          signClient: {
            projectId: config.walletConnectProjectId,
            metadata: {
              name: "Torus Bridge",
              description: "I dont care",
              url: "https://bridge.torus.network",
              icons: [],
            },
          },
        }}
        signerOptions={{
          signingCosmwasm: () => {
            return {
              // TODO cosmos get gas price from registry or RPC
              gasPrice: GasPrice.fromString("0.03token"),
            };
          },
          signingStargate: () => {
            return {
              // TODO cosmos get gas price from registry or RPC
              gasPrice: GasPrice.fromString("0.2tia"),
            };
          },
        }}
        modalTheme={{ defaultTheme: "light" }}
      >
        {children}
      </ChainProvider>
    </ChakraProvider>
  );
}
