import "../styles/globals.css";

import type { Metadata } from "next";
import { Fira_Mono as FiraMono } from "next/font/google";

import { ToastProvider } from "@torus-ts/toast-provider";
import { TorusProvider } from "@torus-ts/torus-provider";
import { ReactQueryProvider } from "@torus-ts/query-provider";
import { Container, Footer, Layout } from "@torus-ts/ui/components";

import { WalletProvider } from "@torus-ts/wallet-provider";
import { WalletHeader } from "./components/wallet-header";
import { EnvScript, env } from "~/env";

const APP_NAME = "Torus Wallet";

export const metadata: Metadata = {
  robots: "all",
  title: APP_NAME,
  icons: [{ rel: "icon", url: "favicon.ico" }],
  description:
    "Simple, secure, and easy-to-use wallet for the torus ecosystem.",
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
    <Layout font={firaMono} headScripts={[EnvScript]}>
      <ToastProvider>
        <TorusProvider
          wsEndpoint={env("NEXT_PUBLIC_TORUS_RPC_URL")}
          torusCacheUrl={env("NEXT_PUBLIC_TORUS_CACHE_URL")}
        >
          <ReactQueryProvider>
            <WalletProvider cacheUrl={env("NEXT_PUBLIC_TORUS_CACHE_URL")}>
              <WalletHeader />
              <Container>{children}</Container>
            </WalletProvider>
          </ReactQueryProvider>
        </TorusProvider>
      </ToastProvider>
      <Footer />
    </Layout>
  );
}
