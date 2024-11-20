import "../styles/globals.css";

import type { Metadata } from "next";

import { Providers } from "@torus-ts/providers/context";
// import { links } from "@torus-ts/ui/data";
// import { Footer } from "@torus-ts/ui";
import { Header } from "@torus-ts/ui";

import { cairo } from "~/utils/fonts";

export const metadata: Metadata = {
  robots: "all",
  title: "torus AI",
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
        className={`relative bg-[#111713] bg-[url('/bg-pattern.svg')] ${cairo.className} animate-fade-in`}
      >
        <Providers>
          <Header
          // font={oxanium.className}
          // logoSrc="/logo.svg"
          // navigationLinks={[
          //   { name: "Governance", href: links.governance, external: true },
          //   { name: "Blog", href: links.blog, external: true },
          //   { name: "Join Community", href: links.discord, external: true },
          // ]}
          // title="Torus Wallet"
          />
          {children}
          {/* FIXME <Footer className="md:hidden lg:block" /> */}
        </Providers>
      </body>
    </html>
  );
}
