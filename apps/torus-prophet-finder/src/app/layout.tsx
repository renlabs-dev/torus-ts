import "@torus-ts/ui/globals.css";
import "./globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";
import { ReactQueryProvider } from "@torus-ts/query-provider";
import { TorusProvider } from "@torus-ts/torus-provider";
import { Layout } from "@torus-ts/ui/components/layout";
import { Toaster } from "@torus-ts/ui/components/toaster";
import { SwarmMemoryProvider } from "~/contexts/swarm-memory-provider";
import { env, EnvScript } from "~/env";
import type { Metadata } from "next";
import { Cinzel, Geist, Geist_Mono } from "next/font/google";
import { ProphetFinderHeader } from "./_components/prophet-finder-header";

const APP_NAME = "Prophet Finder";

export const metadata: Metadata = {
  robots: "all",
  title: APP_NAME,
  icons: [{ rel: "icon", url: "favicon.ico" }],
  description: "The thermodynamic god's favorite Prophet Finder.",
};

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  display: "swap",
  // Include regular weight for paragraphs/headings using default weight
  weight: ["400", "700", "900"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Layout
      font={geistSans}
      className={`${geistMono.variable} ${cinzel.variable}`}
      headScripts={[EnvScript]}
    >
      <ReactQueryProvider>
        <TorusProvider
          wsEndpoint={env("NEXT_PUBLIC_TORUS_RPC_URL")}
          torusCacheUrl={env("NEXT_PUBLIC_TORUS_CACHE_URL")}
        >
          <SwarmMemoryProvider>
            <ProphetFinderHeader
              torusCacheUrl={env("NEXT_PUBLIC_TORUS_CACHE_URL")}
            />
            {children}
            <Toaster />
          </SwarmMemoryProvider>
        </TorusProvider>
        <GoogleAnalytics gaId="G-7YCMH64Q4J" />
      </ReactQueryProvider>
    </Layout>
  );
}
