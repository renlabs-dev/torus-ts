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
import { trySync } from "@torus-network/torus-utils/try-catch";
import { useMultiProvider } from "~/hooks/use-multi-provider";
import type { PropsWithChildren } from "react";
import { useMemo } from "react";
import { createClient, http } from "viem";
import { createConfig, WagmiProvider } from "wagmi";
import { config } from "../consts/config";
import { useWarpCore } from "../hooks/token";

export function initWagmi(multiProvider: MultiProtocolProvider) {
  const [chainsError, chains] = trySync(() =>
    getWagmiChainConfigs(multiProvider),
  );

  if (chainsError !== undefined) {
    console.error("Error getting Wagmi chain configs:", chainsError);
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

  const [configError, wagmiConfig] = trySync(() => {
    if (!chains.length) {
      throw new Error("No chains available for Wagmi configuration");
    }

    const firstChain = chains[0];
    if (!firstChain) {
      throw new Error("First chain is undefined");
    }

    return createConfig({
      chains: [firstChain, ...chains.slice(1)],
      connectors,
      multiInjectedProviderDiscovery: false,
      client({ chain }) {
        const transport = http(chain.rpcUrls.default.http[0]);
        return createClient({ chain, transport });
      },
    });
  });

  if (configError !== undefined) {
    console.error("Error creating Wagmi config:", configError);
    throw configError;
  }

  return { wagmiConfig, chains };
}

export function EvmWalletProvider({
  children,
}: Readonly<PropsWithChildren<unknown>>) {
  const multiProvider = useMultiProvider();
  const warpCore = useWarpCore();

  const { wagmiConfig } = useMemo(() => {
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
  }, [multiProvider]);

  const initialChain = useMemo(() => {
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
  }, [multiProvider, warpCore]);

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
