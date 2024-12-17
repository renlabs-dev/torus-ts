import "../styles/globals.css";

import type { Metadata } from "next";
import { Fira_Mono as FiraMono } from "next/font/google";

import { Providers } from "@torus-ts/providers/context";
import { cn, Footer } from "@torus-ts/ui/components";

import { PageProvider } from "~/context/page-provider";
import { Header } from "./components/header";

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
        <Providers>
          <PageProvider>
            <Header />
            {children}
            <Footer />
          </PageProvider>
        </Providers>
      </body>
    </html>
  );
}
