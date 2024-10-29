import "../styles/globals.css";

import type { Metadata } from "next";
import Link from "next/link";

import { Providers } from "@torus-ts/providers/context";
import { links } from "@torus-ts/ui/data";
import { Footer } from "@torus-ts/ui/footer";
import { Header } from "@torus-ts/ui/header";
import { Wallet, WalletButton } from "@torus-ts/wallet";

import { TRPCReactProvider } from "~/trpc/react";
import { cairo, oxanium } from "~/utils/fonts";
import { DelegatedList } from "./components/delegated-list";
import { Info } from "lucide-react";

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
        className={`bg-[#111713] bg-[url('/bg-pattern.svg')] ${cairo.className} animate-fade-in`}
      >
        <Providers>
          <Wallet />
          <div className="flex w-full animate-fade-down border-b border-white/20 py-2.5">
            <div className="mx-auto flex max-w-screen-md items-center gap-1 px-2">
              <Info className="h-10 w-10 text-green-500 md:h-6 md:w-6" />
              <p className="text-gray-400">
                To assign weights to modules, you need to stake on our
                validator. Click{" "}
                <Link
                  href="/tutorial"
                  className="font-semibold text-green-500 hover:underline"
                >
                  here
                </Link>{" "}
                to get started.
              </p>
            </div>
          </div>
          <Header
            font={oxanium.className}
            logoSrc="/logo.svg"
            navigationLinks={[
              { name: "Governance", href: links.governance, external: true },
              { name: "Docs", href: links.docs, external: false },
              { name: "Blog", href: links.blog, external: true },
              { name: "Join Community", href: links.discord, external: true },
            ]}
            title="torus AI"
            wallet={<WalletButton />}
          />
          <TRPCReactProvider>
            <DelegatedList />
            {children}
          </TRPCReactProvider>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
