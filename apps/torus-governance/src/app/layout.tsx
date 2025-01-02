import "../styles/globals.css";

import type { Metadata } from "next";
import { Fira_Mono as FiraMono } from "next/font/google";

import { ToastProvider } from "@torus-ts/toast-provider";
import { TorusProvider } from "@torus-ts/torus-provider";
import { Layout } from "@torus-ts/ui/components";

import { GovernanceProvider } from "~/context/governance-provider";
import { env } from "~/env";
import { TRPCReactProvider } from "~/trpc/react";

const APP_NAME = "Torus Governance";

export const metadata: Metadata = {
  robots: "all",
  title: APP_NAME,
  icons: [{ rel: "icon", url: "favicon.ico" }],
  description: "Most advanced decentralized AI Protocol.",
};

export const firaMono = FiraMono({
  subsets: ["latin"],
  display: "swap",
  weight: "400",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <Layout font={firaMono}>
      <TorusProvider
        wsEndpoint={env.NEXT_PUBLIC_TORUS_RPC_URL}
        torusCacheUrl={env.NEXT_PUBLIC_TORUS_CACHE_URL}
      >
        <TRPCReactProvider>
          <ToastProvider>
            <GovernanceProvider>{children}</GovernanceProvider>
          </ToastProvider>
        </TRPCReactProvider>
      </TorusProvider>
    </Layout>
  );
}
