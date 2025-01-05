"use client";

import "../styles/globals.css";

// import type { Metadata } from "next";
import { Fira_Mono as FiraMono } from "next/font/google";

import { Layout } from "@torus-ts/ui/components";
import { ErrorBoundary } from "./components/errors/ErrorBoundary";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WarpContextInitGate } from "~/features/WarpContextInitGate";
import { EvmWalletContext } from "~/features/wallet/context/EvmWalletContext";
import { CosmosWalletContext } from "~/features/wallet/context/CosmosWalletContext";
import { AppLayout } from "./components/layout/AppLayout";
import { ToastProvider } from "@torus-ts/toast-provider";
import { useIsSsr } from "@hyperlane-xyz/widgets";

// export const metadata: Metadata = {
//   robots: "all",
//   title: APP_NAME,
//   icons: [{ rel: "icon", url: "favicon.ico" }],
//   description:
//     "Simple, secure, and easy-to-use wallet for the torus ecosystem.",
// };

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
      <ErrorBoundary>
        <ToastProvider>
          <QueryClientProvider client={reactQueryClient}>
            <WarpContextInitGate>
              <EvmWalletContext>
                <CosmosWalletContext>
                  <AppLayout>{children}</AppLayout>
                </CosmosWalletContext>
              </EvmWalletContext>
            </WarpContextInitGate>
          </QueryClientProvider>
        </ToastProvider>
      </ErrorBoundary>
    </Layout>
  );
}
