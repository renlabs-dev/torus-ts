import "@torus-ts/ui/globals.css";

import { GoogleAnalytics } from "@next/third-parties/google";

import { Geist_Mono as GeistMono } from "next/font/google";

import { ReactQueryProvider } from "@torus-ts/query-provider";
import { TorusProvider } from "@torus-ts/torus-provider";
import { Layout } from "@torus-ts/ui/components/layout";
import { Toaster } from "@torus-ts/ui/components/toaster";
import { createSeoMetadata } from "@torus-ts/ui/components/seo";

import { env, EnvScript } from "~/env";
import { TRPCReactProvider } from "~/trpc/react";

import SidebarContainer from "../_components/sidebar/sidebar-container";

export const metadata = createSeoMetadata({
  title: "Torus Portal",
  description: "Manage network permissions, agent allocations, and explore the Torus Network ecosystem",
  keywords: ["torus portal", "permission management", "agent allocation", "network governance", "web3 platform"],
  ogSiteName: "Torus Portal",
  canonical: "/",
  baseUrl: env("BASE_URL"),
});

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
  );
}
