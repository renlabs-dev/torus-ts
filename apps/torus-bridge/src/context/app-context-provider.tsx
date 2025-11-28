"use client";

import { useIsSsr } from "@hyperlane-xyz/widgets";
import { ReactQueryProvider } from "@torus-ts/query-provider";
import { TorusProvider } from "@torus-ts/torus-provider";
import { Container } from "@torus-ts/ui/components/container";
import { Footer } from "@torus-ts/ui/components/footer";
import { Toaster } from "@torus-ts/ui/components/toaster";
import {
  createProviderWithProps,
  ProviderRenderer,
} from "~/app/_components/provider-renderer";
import { WalletHeader } from "~/app/_components/shared/wallet-header";
import { CosmosWalletProvider } from "~/context/cosmos-wallet-provider";
import { EvmWalletProvider } from "~/context/evm-wallet-provider";
import { SolanaWalletProvider } from "~/context/solana-wallet-provider";
import { StarknetWalletProvider } from "~/context/starknet-wallet-provider";
import { WarpContextInitGateProvider } from "~/context/warp-context-init-gate-provider";
import { env } from "~/env";

export function AppContextProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  if (useIsSsr()) return <div></div>;

  return (
    <ProviderRenderer
      providers={[
        createProviderWithProps(TorusProvider, {
          wsEndpoint: env("NEXT_PUBLIC_TORUS_RPC_URL"),
          torusCacheUrl: env("NEXT_PUBLIC_TORUS_CACHE_URL"),
        }),
        ReactQueryProvider,
        WarpContextInitGateProvider,
        EvmWalletProvider,
        SolanaWalletProvider,
        StarknetWalletProvider,
        CosmosWalletProvider,
      ]}
    >
      <WalletHeader />
      <Container>{children}</Container>
      <Toaster />
      <Footer torusChainEnv={env("NEXT_PUBLIC_TORUS_CHAIN_ENV")} />
    </ProviderRenderer>
  );
}
