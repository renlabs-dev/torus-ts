import * as React from "react";
import "@torus-ts/ui/globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";
import { ReactQueryProvider } from "@torus-ts/query-provider";
import { TorusProvider } from "@torus-ts/torus-provider";
import { Container } from "@torus-ts/ui/components/container";
import { Footer } from "@torus-ts/ui/components/footer";
import { Layout } from "@torus-ts/ui/components/layout";
import { Toaster } from "@torus-ts/ui/components/toaster";
import { WalletProvider } from "~/context/wallet-provider";
import { env, EnvScript } from "~/env";
import type { Metadata } from "next";
import { Fira_Mono as FiraMono } from "next/font/google";
import ClientHeroSection from "./components/animation/client-hero-section";
import { APRBar } from "./components/apr-bar";
import { SidebarLinks } from "./components/sidebar-links";
import { WalletBalance } from "./components/wallet-balance";
import { WalletHeader } from "./components/wallet-header";

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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Layout font={firaMono} headScripts={[EnvScript]}>
      <TorusProvider
        wsEndpoint={env("NEXT_PUBLIC_TORUS_RPC_URL")}
        torusCacheUrl={env("NEXT_PUBLIC_TORUS_CACHE_URL")}
      >
        <ReactQueryProvider>
          <WalletProvider>
            <WalletHeader />
            <APRBar />
            <ClientHeroSection />
            <Container>
              <main className="mx-auto flex min-w-full flex-col items-center gap-3 text-white">
                <div className="flex w-full max-w-screen-xl flex-col justify-around gap-6 lg:mt-[10vh] lg:flex-row">
                  <div className="animate-fade flex w-full flex-col gap-4 lg:max-w-[320px]">
                    <SidebarLinks />
                    <WalletBalance />
                  </div>
                  {children}
                </div>
              </main>
            </Container>
            <Toaster />
          </WalletProvider>
        </ReactQueryProvider>
      </TorusProvider>
      <Footer torusChainEnv={env("NEXT_PUBLIC_TORUS_CHAIN_ENV")} />
      <GoogleAnalytics gaId="G-7YCMH64Q4J" />
    </Layout>
  );
}
