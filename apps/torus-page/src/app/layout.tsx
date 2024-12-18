import "../styles/globals.css";

import type { Metadata } from "next";
import { Fira_Mono as FiraMono } from "next/font/google";

import { ToastProvider } from "@torus-ts/toast-provider";
import { TorusProvider } from "@torus-ts/torus-provider";
import { ReactQueryProvider } from "@torus-ts/query-provider";
// import { Footer } from "@torus-ts/ui/components";

import { PageProvider } from "~/context/page-provider";
import { env } from "~/env";
import { cn } from "@torus-ts/ui";
// import { Header } from "./components/header";

export const metadata: Metadata = {
  robots: "all",
  title: "torus",
  icons: [{ rel: "icon", url: "favicon.ico" }],
  description: "The thermodynamic god's favorite child.",
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
    <html lang="en">
      <body
        className={cn(
          firaMono.className,
          `relative overscroll-none bg-background bg-cover text-white`,
        )}
      >
        <ToastProvider>
          <TorusProvider
            wsEndpoint={env.NEXT_PUBLIC_WS_PROVIDER_URL}
            torusCacheUrl={env.NEXT_PUBLIC_CACHE_PROVIDER_URL}
          >
            <ReactQueryProvider>
              <PageProvider>
                {/* <Header /> */}
                {children}
                {/* <Footer /> */}
              </PageProvider>
            </ReactQueryProvider>
          </TorusProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
