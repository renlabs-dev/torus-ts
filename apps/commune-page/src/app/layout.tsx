import "../styles/globals.css";

import type { Metadata } from "next";

import { links } from "@commune-ts/ui/data";
import { Footer } from "@commune-ts/ui/footer";
import { Header } from "@commune-ts/ui/header";

import { cairo, oxanium } from "~/utils/fonts";

export const metadata: Metadata = {
  robots: "all",
  title: "Commune AI",
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
        className={`relative bg-[#111713] bg-[url('/bg-pattern.svg')] text-gray-200 ${cairo.className} animate-fade-in`}
      >
        <Header
          font={oxanium.className}
          logoSrc="/logo.svg"
          navigationLinks={[
            { name: "Governance", href: links.governance, external: true },
            { name: "Community Validator", href: links.validator, external: true },
            { name: "Docs", href: links.docs, external: false },
            { name: "Blog", href: links.blog, external: true },
            { name: "Wallet", href: links.wallet, external: true },
            { name: "Join Community", href: links.discord, external: true },
          ]}
          title="Commune AI"
        />
        {children}
        <Footer shouldBeFixed className="md:hidden lg:block" />
      </body>
    </html>
  );
}
