import "../styles/globals.css";

import type { Metadata } from "next";

import { ToastProvider } from "@torus-ts/toast-provider";
import { TorusProvider } from "@torus-ts/torus-provider";
import { Layout } from "@torus-ts/ui";

import { env } from "~/env";
import { TRPCReactProvider } from "~/trpc/react";
import { DelegatedList } from "./components/delegated-list";
import { AllocatorHeader } from "./components/allocator-header";
import { TutorialDialog } from "./components/tutorial-dialog";
import { Fira_Mono as FiraMono } from "next/font/google";

const APP_NAME = "Allocator";

export const metadata: Metadata = {
  robots: "all",
  title: APP_NAME,
  icons: [{ rel: "icon", url: "favicon.ico" }],
  description: "The thermodynamic god's favorite Allocator.",
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
      <ToastProvider>
        <TorusProvider
          wsEndpoint={env.NEXT_PUBLIC_TORUS_RPC_URL}
          torusCacheUrl={env.NEXT_PUBLIC_TORUS_CACHE_URL}
        >
          <TRPCReactProvider>
            <AllocatorHeader />
            <TutorialDialog />
            <DelegatedList />
            {children}
          </TRPCReactProvider>
        </TorusProvider>
      </ToastProvider>
    </Layout>
  );
}
