import "../styles/globals.css";

import type { Metadata } from "next";
import { Fira_Mono as FiraMono } from "next/font/google";

import { Providers } from "@torus-ts/providers/context";
import { TorusProvider } from "@torus-ts/torus-provider";
import { Layout } from "@torus-ts/ui/components";

import { WalletProvider } from "~/context/wallet-provider";
import { env } from "~/env";

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
    <Layout font={firaMono} appName={APP_NAME}>
      <Providers>
        <TorusProvider
          wsEndpoint={env.NEXT_PUBLIC_WS_PROVIDER_URL}
          torusCacheUrl={env.NEXT_PUBLIC_CACHE_PROVIDER_URL}
        >
          <WalletProvider>{children}</WalletProvider>
        </TorusProvider>
      </Providers>
    </Layout>
  );
}
