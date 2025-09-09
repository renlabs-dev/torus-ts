import "@torus-ts/ui/globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Layout } from "@torus-ts/ui/components/layout";
import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { env, EnvScript } from "~/env";
import PlausibleProvider from "next-plausible";
import { Fira_Mono as FiraMono } from "next/font/google";
import * as React from "react";
import { Footer } from "./_components/footer";
import { HoverHeader } from "./_components/hover-header";

export function generateMetadata() {
  return createSeoMetadata({
    title: "Torus Network",
    description:
      "Decentralized infrastructure platform built on Substrate. Explore the future of blockchain technology and decentralized applications.",
    keywords: [
      "torus network",
      "decentralized infrastructure",
      "substrate blockchain",
      "web3 platform",
      "blockchain technology",
    ],
    ogSiteName: "Torus Network",
    canonical: "/",
    baseUrl: env("BASE_URL"),
  });
}

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
    <PlausibleProvider
      domain="torus.network,rollup.torus.network"
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
