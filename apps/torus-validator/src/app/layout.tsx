import "../styles/globals.css";

import type { Metadata } from "next";

import { ToastProvider } from "@torus-ts/toast-provider";
import { TorusProvider } from "@torus-ts/torus-provider";
import { Footer, Layout } from "@torus-ts/ui";

import { env } from "~/env";
import { TRPCReactProvider } from "~/trpc/react";
import { DelegatedList } from "./components/delegated-list";
import { AllocatorHeader } from "./components/allocator-header";
import { Fira_Mono as FiraMono } from "next/font/google";

const APP_NAME = "Torus Allocator";

export const metadata: Metadata = {
  robots: "all",
  title: APP_NAME,
  icons: [{ rel: "icon", url: "favicon.ico" }],
  description: "Making decentralized AI for everyone",
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
    <Layout font={firaMono} appName={APP_NAME}>
      <TorusProvider
        wsEndpoint={env.TORUS_RPC_URL}
        torusCacheUrl={env.TORUS_CACHE_URL}
      >
        <TRPCReactProvider>
          <ToastProvider>
            <AllocatorHeader />
            <DelegatedList />
            {children}
            <Footer />
          </ToastProvider>
        </TRPCReactProvider>
      </TorusProvider>
    </Layout>
  );
}
