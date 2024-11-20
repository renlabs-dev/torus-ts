import "../styles/globals.css";

import type { Metadata } from "next";
import { Fira_Mono as FiraMono } from "next/font/google";

import { Providers } from "@torus-ts/providers/context";
import { Layout } from "@torus-ts/ui/components";

import { Header } from "./components/header";

export const metadata: Metadata = {
  robots: "all",
  title: "𝐓𝐨𝐫𝐮𝐬",
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
    <Layout
      font={firaMono}
      shouldDisplayHeader={false}
      className="bg-[url('/bg-pattern.svg')]"
    >
      <Header />
      <Providers>{children}</Providers>
    </Layout>
  );
}
