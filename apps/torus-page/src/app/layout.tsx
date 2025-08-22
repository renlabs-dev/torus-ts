import "@torus-ts/ui/globals.css";

import * as React from "react";

import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
import PlausibleProvider from "next-plausible";
import { Fira_Mono as FiraMono } from "next/font/google";

import { Layout } from "@torus-ts/ui/components/layout";

import { EnvScript, env } from "~/env";

import { Footer } from "./_components/footer";
import { HoverHeader } from "./_components/hover-header";

export const metadata: Metadata = {
  robots: "all",
  title: "Torus",
  icons: [{ rel: "icon", url: "favicon.ico" }],
  description: "The thermodynamic god's favorite child.",
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
  const isMainnet = env("NEXT_PUBLIC_TORUS_CHAIN_ENV") === "mainnet";
  const domains = isMainnet
    ? "torus.network,rollup.torus.network"
    : "testnet.torus.network,testnet.rollup.torus.network";

  return (
    <PlausibleProvider
      domain={domains}
      trackOutboundLinks
    >
      <Layout font={firaMono} headScripts={[EnvScript]}>
        <HoverHeader />
        {children}
        <Footer />
        <GoogleAnalytics gaId="G-7YCMH64Q4J" />
      </Layout>
    </PlausibleProvider>
  );
}
