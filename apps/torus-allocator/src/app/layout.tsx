import "@torus-ts/ui/globals.css";

import { GoogleAnalytics } from "@next/third-parties/google";
import PlausibleProvider from "next-plausible";
import { Fira_Mono as FiraMono } from "next/font/google";

import { Layout } from "@torus-ts/ui/components/layout";

import { EnvScript } from "~/env";

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
      domain="allocator.torus.network,rollup.torus.network"
      trackOutboundLinks
    >
      <Layout font={firaMono} headScripts={[EnvScript]}>
        {children}
        <GoogleAnalytics gaId="G-7YCMH64Q4J" />
      </Layout>
    </PlausibleProvider>
  );
}
