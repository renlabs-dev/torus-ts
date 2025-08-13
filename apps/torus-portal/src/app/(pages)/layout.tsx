import "@torus-ts/ui/globals.css";

import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
import PlausibleProvider from "next-plausible";
import { Geist_Mono as GeistMono } from "next/font/google";

import { ReactQueryProvider } from "@torus-ts/query-provider";
import { TorusProvider } from "@torus-ts/torus-provider";
import { Layout } from "@torus-ts/ui/components/layout";
import { Toaster } from "@torus-ts/ui/components/toaster";

import { env, EnvScript } from "~/env";
import { TRPCReactProvider } from "~/trpc/react";

import SidebarContainer from "../_components/sidebar/sidebar-container";

const APP_NAME = "Torus Portal";

export const metadata: Metadata = {
  robots: "all",
  title: APP_NAME,
  icons: [{ rel: "icon", url: "favicon.ico" }],
  description: "The thermodynamic god's favorite Portal.",
};

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
    <PlausibleProvider domain="torus.network" trackOutboundLinks>
      <Layout font={geistMono} headScripts={[EnvScript]}>
        <ReactQueryProvider>
          <TorusProvider
            wsEndpoint={env("NEXT_PUBLIC_TORUS_RPC_URL")}
            torusCacheUrl={env("NEXT_PUBLIC_TORUS_CACHE_URL")}
          >
            <TRPCReactProvider>
              <SidebarContainer>{children}</SidebarContainer>
              <Toaster />
              <GoogleAnalytics gaId="G-7YCMH64Q4J" />
            </TRPCReactProvider>
          </TorusProvider>
        </ReactQueryProvider>
      </Layout>
    </PlausibleProvider>
  );
}
