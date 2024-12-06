import "../styles/globals.css";

import type { Metadata } from "next";
import { Fira_Mono as FiraMono } from "next/font/google";

import { cn } from "@torus-ts/ui/components";

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
        {/* <Providers>
          <Header /> */}
        {children}
        {/* <Footer />
        </Providers> */}
      </body>
    </html>
  );
}
