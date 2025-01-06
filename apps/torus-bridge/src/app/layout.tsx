"use client";

import "../styles/globals.css";

// import type { Metadata } from "next";
import { Fira_Mono as FiraMono } from "next/font/google";
import { CosmosWalletProvider } from "~/context/cosmos-wallet-provider";
import { ErrorBoundaryProvider } from "~/context/error-boundary-provider";
import { EvmWalletProvider } from "~/context/evm-wallet-provider";
import { WarpContextInitGateProvider } from "~/context/warp-context-init-gate-provider";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastProvider } from "@torus-ts/toast-provider";
import { Layout } from "@torus-ts/ui";

import { AppLayout } from "./_components/app-layout";

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
  // const isSsr = useIsSsr();
  // if (isSsr) {
  //   return <Layout font={firaMono}>We are fucked</Layout>;
  // }

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
