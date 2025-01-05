import type { MultiProtocolProvider } from "@hyperlane-xyz/sdk";
import { ProtocolType } from "@hyperlane-xyz/utils";
import { getWagmiChainConfigs } from "@hyperlane-xyz/widgets";
import {
  RainbowKitProvider,
  connectorsForWallets,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import {
  argentWallet,
  coinbaseWallet,
  injectedWallet,
  ledgerWallet,
  metaMaskWallet,
  rainbowWallet,
  trustWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import type { PropsWithChildren } from "react";
import { useMemo } from "react";
import { createClient, http } from "viem";
import { WagmiProvider, createConfig } from "wagmi";

import { config } from "../consts/config";

import { useMultiProvider } from "../features/chains/hooks";
import { useWarpCore } from "../features/tokens/hooks";

function initWagmi(multiProvider: MultiProtocolProvider) {
  const chains = getWagmiChainConfigs(multiProvider);

  const connectors = connectorsForWallets(
    [
      {
        groupName: "Recommended",
        wallets: [
          metaMaskWallet,
          injectedWallet,
          walletConnectWallet,
          ledgerWallet,
        ],
      },
      {
        groupName: "More",
        wallets: [coinbaseWallet, rainbowWallet, trustWallet, argentWallet],
      },
    ],
    { appName: "Torus Base Bridge", projectId: config.walletConnectProjectId },
  );

  const wagmiConfig = createConfig({
    // Splice to make annoying wagmi type happy
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    chains: [chains[0]!, ...chains.splice(1)],
    connectors,
    client({ chain }) {
      const transport = http(chain.rpcUrls.default.http[0]);
      return createClient({ chain, transport });
    },
  });

  return { wagmiConfig, chains };
}

export function EvmWalletProvider({ children }: PropsWithChildren<unknown>) {
  const multiProvider = useMultiProvider();
  const warpCore = useWarpCore();

  const { wagmiConfig } = useMemo(
    () => initWagmi(multiProvider),
    [multiProvider],
  );

  const initialChain = useMemo(() => {
    const tokens = warpCore.tokens;
    const firstEvmToken = tokens.find(
      (token) => token.protocol === ProtocolType.Ethereum,
    );
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-non-null-asserted-optional-chain
    return multiProvider.tryGetChainMetadata(firstEvmToken?.chainName!)
      ?.chainId as number;
  }, [multiProvider, warpCore]);

  return (
    <WagmiProvider config={wagmiConfig}>
      <RainbowKitProvider
        theme={darkTheme({
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
