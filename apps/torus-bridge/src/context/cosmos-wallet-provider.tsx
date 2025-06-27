"use client";

import { GasPrice } from "@cosmjs/stargate";
import { wallets as cosmostationWallets } from "@cosmos-kit/cosmostation";
import { wallets as keplrWallets } from "@cosmos-kit/keplr";
import { wallets as leapWallets } from "@cosmos-kit/leap";
import { ChainProvider } from "@cosmos-kit/react";
import { cosmoshub } from "@hyperlane-xyz/registry";
import { MultiProtocolProvider } from "@hyperlane-xyz/sdk";
import { getCosmosKitChainConfigs } from "@hyperlane-xyz/widgets";
import { config } from "~/consts/config";
import { useMultiProvider } from "~/hooks/use-multi-provider";
import type { PropsWithChildren } from "react";
import { useMemo } from "react";
import { trySync } from "@torus-network/torus-utils/try-catch";

export function CosmosWalletProvider({
  children,
}: Readonly<PropsWithChildren<unknown>>) {
  const chainMetadata = useMultiProvider().metadata;

  const { chains, assets } = useMemo(() => {
    const [providerError, multiProvider] = trySync(
      () =>
        new MultiProtocolProvider({
          ...chainMetadata,
          cosmoshub,
        }),
    );

    if (providerError !== undefined) {
      console.error("Error creating MultiProtocolProvider:", providerError);
      // Return empty defaults in case of error
      return { chains: [], assets: [] };
    }

    const [configError, configs] = trySync(() =>
      getCosmosKitChainConfigs(multiProvider),
    );

    if (configError !== undefined) {
      console.error("Error getting Cosmos Kit chain configs:", configError);
      return { chains: [], assets: [] };
    }

    return configs;
  }, [chainMetadata]);

  // Handle Leap wallet initialization
  const [walletError, leapWithoutSnap] = trySync(() =>
    leapWallets.filter((wallet) => !wallet.walletName.includes("snap")),
  );

  if (walletError !== undefined) {
    console.warn("Error filtering leap wallets (non-critical):", walletError);
  }

  // Create a safe wallet array
  const wallets = [
    ...keplrWallets,
    ...cosmostationWallets,
    ...(leapWithoutSnap ?? []),
  ];

  return (
    <ChainProvider
      chains={chains}
      assetLists={assets}
      wallets={wallets}
      walletConnectOptions={{
        signClient: {
          projectId: config.walletConnectProjectId,
          metadata: {
            name: "suicide",
            description: "i want",
            url: "http://localhost:3006/",
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
    >
      {children}
    </ChainProvider>
  );
}
