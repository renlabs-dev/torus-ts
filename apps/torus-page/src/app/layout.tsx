import "../styles/globals.css";

import type { Metadata } from "next";

import { links } from "@torus-ts/ui/data";
import { Footer } from "@torus-ts/ui/footer";
import { Header } from "@torus-ts/ui/header";

import { cairo, oxanium } from "~/utils/fonts";

export const metadata: Metadata = {
  robots: "all",
  title: "Torus",
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
        className={`bg-[url('/bg-pattern.svg')] bg-cover text-gray-200 ${cairo.className} animate-fade-in flex w-full justify-center`}
      >
        <div className="m-3 w-full rounded-xl">
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
        </div>
      </body>
    </html>
  );
}
