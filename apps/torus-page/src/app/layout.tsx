import "../styles/globals.css";

import type { Metadata } from "next";

import { Footer } from "@torus-ts/ui";
import { links } from "@torus-ts/ui/data";
import { Header } from "@torus-ts/ui/header";

import { firaMono, oxanium } from "~/utils/fonts";

export const metadata: Metadata = {
  robots: "all",
  title: "𝐓𝐨𝐫𝐮𝐬",
  icons: [{ rel: "icon", url: "favicon.ico" }],
  description: "Most advanced decentralized AI Protocol",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <body
        className={`bg-[url('/bg-pattern.svg')] bg-cover text-gray-200 ${firaMono.className}`}
      >
        <Header
          font={oxanium.className}
          logoSrc="/logo.svg"
          navigationLinks={[
            { name: "Governance", href: links.governance, external: true },
            {
              name: "Community Validator",
              href: links.validator,
              external: true,
            },
            { name: "Docs", href: links.docs, external: false },
            { name: "Blog", href: links.blog, external: true },
            { name: "Wallet", href: links.wallet, external: true },
            { name: "Join Community", href: links.discord, external: true },
          ]}
          title="Torus"
        />
        {children}
        <Footer />
      </body>
    </html>
  );
}
