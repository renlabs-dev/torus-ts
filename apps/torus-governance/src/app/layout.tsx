import "../styles/globals.css";

import type { Metadata } from "next";

import { Providers } from "@torus-ts/providers/context";
import { Footer, Header } from "@torus-ts/ui";
import { Wallet } from "@torus-ts/wallet";

import { TRPCReactProvider } from "~/trpc/react";
import { cairo } from "~/utils/fonts";
import ProposalRewardCard from "./components/proposal-reward-card";

export const metadata: Metadata = {
  robots: "all",
  title: "Community Governance",
  icons: [{ rel: "icon", url: "favicon.ico" }],
  description: "Making decentralized AI for everyone",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <body
        className={`bg-[#111713] bg-[url('/bg-pattern.svg')] ${cairo.className} animate-fade-in h-full`}
      >
        <Providers>
          <ProposalRewardCard />
          <TRPCReactProvider>
            <Wallet />
            <Header />
            {children}
            <Footer />
          </TRPCReactProvider>
        </Providers>
      </body>
    </html>
  );
}
