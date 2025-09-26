import "@torus-ts/ui/globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";
import { ReactQueryProvider } from "@torus-ts/query-provider";
import { TorusProvider } from "@torus-ts/torus-provider";
import { Layout } from "@torus-ts/ui/components/layout";
import { Toaster } from "@torus-ts/ui/components/toaster";
import { env, EnvScript } from "~/env";
import type { Metadata } from "next";
import { Fira_Mono as FiraMono } from "next/font/google";
import { ProphetFinderHeader } from "./_components/prophet-finder-header";

const APP_NAME = "Prophet Finder";

export const metadata: Metadata = {
  robots: "all",
  title: APP_NAME,
  icons: [{ rel: "icon", url: "favicon.ico" }],
  description: "The thermodynamic god's favorite Prophet Finder.",
};

export const firaMono = FiraMono({
  subsets: ["latin"],
  display: "swap",
  weight: "400",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Layout font={firaMono} headScripts={[EnvScript]}>
      <ReactQueryProvider>
        <TorusProvider
          wsEndpoint={env("NEXT_PUBLIC_TORUS_RPC_URL")}
          torusCacheUrl={env("NEXT_PUBLIC_TORUS_CACHE_URL")}
        >
          <ProphetFinderHeader
            torusCacheUrl={env("NEXT_PUBLIC_TORUS_CACHE_URL")}
          />
          {children}
          <Toaster />
        </TorusProvider>
        <GoogleAnalytics gaId="G-7YCMH64Q4J" />
      </ReactQueryProvider>
    </Layout>
  );
}
