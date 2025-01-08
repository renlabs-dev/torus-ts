"use client";

import "../styles/globals.css";
import { useIsSsr } from "@hyperlane-xyz/widgets";

// import type { Metadata } from "next";
import { Fira_Mono as FiraMono } from "next/font/google";
import { CosmosWalletProvider } from "~/context/cosmos-wallet-provider";
import { EvmWalletProvider } from "~/context/evm-wallet-provider";
import { WarpContextInitGateProvider } from "~/context/warp-context-init-gate-provider";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@torus-ts/toast-provider";
import { Layout, Loading } from "@torus-ts/ui";

import { SolanaWalletProvider } from "~/context/solana-wallet-provider";
import { TorusProvider } from "@torus-ts/torus-provider";
import { env } from "~/env";
import { WalletProvider } from "~/context/wallet-provider";
import { WalletHeader } from "./_components/shared/wallet-header";

export const firaMono = FiraMono({
  subsets: ["latin"],
  display: "swap",
  weight: "400",
});

const reactQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  // // Disable app SSR for now as it's not needed and
  // // complicates wallet and graphql integrations
  const isSsr = useIsSsr();
  if (isSsr) {
    return (
      <Layout font={firaMono}>
        <div className="min-w-screen flex min-h-screen items-center justify-center">
          <Loading /> Loading Bridge...
        </div>
      </Layout>
    );
  }

  return (
    <Layout font={firaMono}>
      <ToastProvider>
        <QueryClientProvider client={reactQueryClient}>
          <TorusProvider
            wsEndpoint={env.NEXT_PUBLIC_TORUS_RPC_URL}
            torusCacheUrl={env.NEXT_PUBLIC_TORUS_CACHE_URL}
          >
            <WalletProvider>
              <WarpContextInitGateProvider>
                <EvmWalletProvider>
                  <SolanaWalletProvider>
                    <CosmosWalletProvider>
                      <WalletHeader />
                      {children}
                    </CosmosWalletProvider>
                  </SolanaWalletProvider>
                </EvmWalletProvider>
              </WarpContextInitGateProvider>
            </WalletProvider>
          </TorusProvider>
        </QueryClientProvider>
      </ToastProvider>
    </Layout>
  );
}
