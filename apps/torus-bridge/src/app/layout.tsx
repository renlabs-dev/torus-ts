"use client";

import "../styles/globals.css";

// import type { Metadata } from "next";
import { Fira_Mono as FiraMono } from "next/font/google";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { useIsSsr } from "@hyperlane-xyz/widgets";
import { AppLayout } from "./_components/app-layout";
import { ToastProvider } from "@torus-ts/toast-provider";
import { EvmWalletProvider } from "~/context/evm-wallet-provider";
import { CosmosWalletProvider } from "~/context/cosmos-wallet-provider";
import { ErrorBoundaryProvider } from "~/context/error-boundary-provider";
import { Layout } from "@torus-ts/ui";
import { WarpContextInitGateProvider } from "~/context/warp-context-init-gate-provider";

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
  // Disable app SSR for now as it's not needed and
  // complicates wallet and graphql integrations
  const isSsr = useIsSsr();
  if (isSsr) {
    return <div></div>;
  }

  return (
    <Layout font={firaMono}>
      <ErrorBoundaryProvider>
        <ToastProvider>
          <QueryClientProvider client={reactQueryClient}>
            <WarpContextInitGateProvider>
              <EvmWalletProvider>
                <CosmosWalletProvider>
                  <AppLayout>{children}</AppLayout>
                </CosmosWalletProvider>
              </EvmWalletProvider>
            </WarpContextInitGateProvider>
          </QueryClientProvider>
        </ToastProvider>
      </ErrorBoundaryProvider>
    </Layout>
  );
}
