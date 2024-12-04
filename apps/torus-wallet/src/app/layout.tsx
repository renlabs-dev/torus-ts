import "../styles/globals.css";

import type { Metadata } from "next";
import { Fira_Mono as FiraMono } from "next/font/google";

import { Providers } from "@torus-ts/providers/context";
import { Layout } from "@torus-ts/ui/components";

const APP_NAME = "Torus Wallet";

export const metadata: Metadata = {
  robots: "all",
  title: APP_NAME,
  icons: [{ rel: "icon", url: "favicon.ico" }],
  description: "Most advanced decentralized AI Protocol.",
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
      <Providers>{children}</Providers>
    </Layout>
  );
}
