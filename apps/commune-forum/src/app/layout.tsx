import "../styles/globals.css";

import type { Metadata } from "next";

import { Providers } from "@commune-ts/providers/context";
import { links } from "@commune-ts/ui/data";
import { Footer } from "@commune-ts/ui/footer";
import { Header } from "@commune-ts/ui/header";
import { Wallet, WalletButton } from "@commune-ts/wallet";

import { TRPCReactProvider } from "~/trpc/react";
import { cairo, oxanium } from "~/utils/fonts";

export const metadata: Metadata = {
  robots: "all",
  title: "Community Forum",
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
          <TRPCReactProvider>
            <Wallet />
            <Header
              font={oxanium.className}
              logoSrc="/logo.svg"
              title="Community Forum"
              wallet={<WalletButton />}
              navigationLinks={[
                { name: "Homepage", href: links.landing_page, external: true },
                { name: "Join Community", href: links.discord, external: true },
              ]}
            />
            {children}
            <Footer />
          </TRPCReactProvider>
        </Providers>
      </body>
    </html>
  );
}
