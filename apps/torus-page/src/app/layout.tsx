import "../styles/globals.css";

import type { Metadata } from "next";
import { Fira_Mono as FiraMono } from "next/font/google";

import { ToastProvider } from "@torus-ts/toast-provider";
import { TorusProvider } from "@torus-ts/torus-provider";
import { ReactQueryProvider } from "@torus-ts/query-provider";

import { PageProvider } from "~/context/page-provider";
import { env } from "~/env";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  cn,
  Footer,
} from "@torus-ts/ui";
import { Suspense } from "react";
import { Bridge } from "./components/bridge";
import { HoverHeader } from "./components/hover-header";

export const metadata: Metadata = {
  robots: "all",
  title: "Torus",
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
                <HoverHeader />
                <div className="fixed inset-0 z-40 hidden items-end justify-center md:flex">
                  <Suspense fallback="...loading">
                    <Bridge />
                  </Suspense>
                </div>
                <div className="fixed inset-0 mx-6 mb-6 flex items-end justify-center md:hidden">
                  <Card>
                    <CardHeader>Bridge your assets to Torus.</CardHeader>
                    <CardContent>
                      <CardDescription>
                        Enter this page on a desktop browser to use the bridge.
                        (Bridge Closes: 12/31/24, 11:11 PM UTC)
                      </CardDescription>
                    </CardContent>
                  </Card>
                </div>
                {children}
                <Footer />
              </PageProvider>
            </ReactQueryProvider>
          </TorusProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
