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
import { useMemo } from "react";
import { createClient, http } from "viem";
import { createConfig, WagmiProvider } from "wagmi";
import { config } from "../consts/config";
import { useWarpCore } from "../hooks/token";

export function initWagmi(multiProvider: MultiProtocolProvider) {
  const chains = getWagmiChainConfigs(multiProvider);

  const connectors = connectorsForWallets(
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
    { appName: "Torus Base Bridge", projectId: config.walletConnectProjectId },
  );

  const wagmiConfig = createConfig({
    // Splice to make annoying wagmi type happy
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    chains: [chains[0]!, ...chains.splice(1)],
    connectors,
    multiInjectedProviderDiscovery: false,
    client({ chain }) {
      const transport = http(chain.rpcUrls.default.http[0]);
      return createClient({ chain, transport });
    },
  });

  return { wagmiConfig, chains };
}

export function EvmWalletProvider({
  children,
}: Readonly<PropsWithChildren<unknown>>) {
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
