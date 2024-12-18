import "../styles/globals.css";

import type { Metadata } from "next";
import Link from "next/link";
import { Info } from "lucide-react";

import { QueryProvider } from "@torus-ts/query-provider/context";
import { TorusProvider } from "@torus-ts/torus-provider";
import { Footer } from "@torus-ts/ui";

import { env } from "~/env";
import { TRPCReactProvider } from "~/trpc/react";
import { cairo } from "~/utils/fonts";
import { DelegatedList } from "./components/delegated-list";
import { AllocatorHeader } from "./components/allocator-header";

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
        <QueryProvider>
          <TorusProvider
            wsEndpoint={env.NEXT_PUBLIC_WS_PROVIDER_URL}
            torusCacheUrl={env.NEXT_PUBLIC_CACHE_PROVIDER_URL}
          >
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
            <AllocatorHeader />
            <TRPCReactProvider>
              <DelegatedList />
              {children}
            </TRPCReactProvider>
            <Footer />
          </TorusProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
