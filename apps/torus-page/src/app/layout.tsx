import "../styles/globals.css";

import type { Metadata } from "next";
import { Fira_Mono as FiraMono } from "next/font/google";

import { Layout } from "@torus-ts/ui/components";

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
  return <Layout font={firaMono} className="bg-[url('/bg-pattern.svg')]">{children}</Layout>;
}
