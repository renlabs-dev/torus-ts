"use client";

import type { MultiProtocolProvider } from "@hyperlane-xyz/sdk";
import { ProtocolType } from "@hyperlane-xyz/utils";
import { getWagmiChainConfigs } from "@hyperlane-xyz/widgets";
import {
  connectorsForWallets,
  midnightTheme,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import {
  argentWallet,
  coinbaseWallet,
  injectedWallet,
  ledgerWallet,
  metaMaskWallet,
  rainbowWallet,
  trustWallet,
  uniswapWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { useMultiProvider } from "~/hooks/use-multi-provider";
import type { PropsWithChildren } from "react";
import { useMemo, useState, useEffect } from "react";
import { createClient, http } from "viem";
import { createConfig, WagmiProvider } from "wagmi";
import { config } from "../consts/config";
import { useWarpCore } from "../hooks/token";
import { trySync } from "@torus-network/torus-utils/try-catch";

export function initWagmi(multiProvider: MultiProtocolProvider) {
  const [chainsError, chains] = trySync(() =>
    getWagmiChainConfigs(multiProvider),
  );

  if (chainsError !== undefined) {
    console.error("Error getting Wagmi chain configs:", chainsError);
    // Return default chains or throw based on your error handling strategy
    throw chainsError;
  }

  const [connectorsError, connectors] = trySync(() =>
    connectorsForWallets(
      [
        {
          groupName: "Recommended",
          wallets: [metaMaskWallet, walletConnectWallet, ledgerWallet],
        },
        {
          groupName: "More",
          wallets: [
            coinbaseWallet,
            rainbowWallet,
            trustWallet,
            argentWallet,
            uniswapWallet,
            injectedWallet,
          ],
        },
      ],
      {
        appName: "Torus Base Bridge",
        projectId: config.walletConnectProjectId,
      },
    ),
  );

  if (connectorsError !== undefined) {
    console.error("Error creating wallet connectors:", connectorsError);
    throw connectorsError;
  }

  const [configError, wagmiConfig] = trySync(() =>
    createConfig({
      // Splice to make annoying wagmi type happy
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      chains: [chains[0]!, ...chains.slice(1)],
      connectors,
      multiInjectedProviderDiscovery: false,
      client({ chain }) {
        const transport = http(chain.rpcUrls.default.http[0]);
        return createClient({ chain, transport });
      },
    }),
  );

  if (configError !== undefined) {
    console.error("Error creating Wagmi config:", configError);
    throw configError;
  }

  return { wagmiConfig, chains };
}

export function EvmWalletProvider({
  children,
}: Readonly<PropsWithChildren<unknown>>) {
  // Add client-side rendering check
  const [hasMounted, setHasMounted] = useState(false);

  const multiProvider = useMultiProvider();
  const warpCore = useWarpCore();

  // Effect to run after client-side mounting
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const { wagmiConfig } = useMemo(() => {
    // Don't attempt to initialize during SSR
    if (!hasMounted) {
      return { wagmiConfig: null };
    }

    // Only initialize if multiProvider has chains loaded
    const [chainNamesError, chainNames] = trySync(() =>
      multiProvider.getKnownChainNames(),
    );

    if (chainNamesError !== undefined) {
      console.error("Error getting known chain names:", chainNamesError);
      return { wagmiConfig: null };
    }

    if (!chainNames.length) {
      return { wagmiConfig: null };
    }

    const [initError, wagmiData] = trySync(() => initWagmi(multiProvider));

    if (initError !== undefined) {
      console.error("Error initializing Wagmi:", initError);
      return { wagmiConfig: null };
    }

    return wagmiData;
  }, [multiProvider, hasMounted]);

  const initialChain = useMemo(() => {
    // Don't attempt to initialize during SSR
    if (!hasMounted) {
      return undefined;
    }

    if (!warpCore.tokens.length) return undefined;

    const [firstTokenError, firstEvmToken] = trySync(() =>
      warpCore.tokens.find((token) => token.protocol === ProtocolType.Ethereum),
    );

    if (firstTokenError !== undefined) {
      console.error("Error finding first EVM token:", firstTokenError);
      return undefined;
    }

    if (!firstEvmToken?.chainName) return undefined;

    const [metadataError, chainMetadata] = trySync(() =>
      multiProvider.tryGetChainMetadata(firstEvmToken.chainName),
    );

    if (metadataError !== undefined) {
      console.error("Error getting chain metadata:", metadataError);
      return undefined;
    }

    return chainMetadata?.chainId as number | undefined;
  }, [multiProvider, warpCore, hasMounted]);

  // During server-side rendering or initial client render, return minimal structure
  if (!hasMounted) {
    return <>{children}</>;
  }

  // If we don't have a valid wagmiConfig yet, just render children without the provider
  if (!wagmiConfig) {
    return <>{children}</>;
  }

  return (
    <WagmiProvider config={wagmiConfig}>
      <RainbowKitProvider
        theme={midnightTheme({
          accentColor: "#A7AFBE",
          borderRadius: "small",
          fontStack: "system",
        })}
        initialChain={initialChain}
      >
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  );
}
