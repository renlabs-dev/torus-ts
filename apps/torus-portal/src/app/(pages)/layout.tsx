import "@torus-ts/ui/globals.css";
import { ReactQueryProvider } from "@torus-ts/query-provider";
import { TorusProvider } from "@torus-ts/torus-provider";
import { Layout } from "@torus-ts/ui/components/layout";
import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { Toaster } from "@torus-ts/ui/components/toaster";
import { env, EnvScript } from "~/env";
import { TRPCReactProvider } from "~/trpc/react";
import PlausibleProvider from "next-plausible";
import { Geist_Mono as GeistMono } from "next/font/google";
import * as React from "react";

export function generateMetadata() {
  return createSeoMetadata({
    title: "Torus",
    description: "The thermodynamic god's favorite child.",
    keywords: [
      "torus",
      "decentralized infrastructure",
      "substrate blockchain",
      "web3 platform",
      "blockchain technology",
    ],
    ogSiteName: "Torus",
    canonical: "/",
    baseUrl: env("BASE_URL"),
  });
}

export const geistMono = GeistMono({
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
    <PlausibleProvider
      domain="torus.network,rollup.torus.network"
      trackOutboundLinks
    >
      <ReactQueryProvider>
        <TorusProvider
          wsEndpoint={env("NEXT_PUBLIC_TORUS_RPC_URL")}
          torusCacheUrl={env("NEXT_PUBLIC_TORUS_CACHE_URL")}
        >
          <TRPCReactProvider>
            <Layout font={geistMono} headScripts={[EnvScript]}>
              {children}
            </Layout>
            <Toaster />
          </TRPCReactProvider>
        </TorusProvider>
      </ReactQueryProvider>
    </PlausibleProvider>
  );
}
