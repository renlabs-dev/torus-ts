import "../globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";
import { ReactQueryProvider } from "@torus-ts/query-provider";
import { TorusProvider } from "@torus-ts/torus-provider";
import { Layout } from "@torus-ts/ui/components/layout";
import { Toaster } from "@torus-ts/ui/components/toaster";
import { env, EnvScript } from "~/env";
import { TRPCReactProvider } from "~/trpc/react";
import type { Metadata } from "next";
import { Geist_Mono as GeistMono } from "next/font/google";

const APP_NAME = "Prophet Finder";

export const metadata: Metadata = {
  robots: "all",
  title: APP_NAME,
  icons: [{ rel: "icon", url: "favicon.ico" }],
  description: "The thermodynamic god's favorite Prophet Finder.",
};

export const geistMono = GeistMono({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Layout font={geistMono} headScripts={[EnvScript]}>
      <ReactQueryProvider>
        <TorusProvider
          wsEndpoint={env("NEXT_PUBLIC_TORUS_RPC_URL")}
          torusCacheUrl={env("NEXT_PUBLIC_TORUS_CACHE_URL")}
        >
          <TRPCReactProvider>
            {children}
            <Toaster />
          </TRPCReactProvider>
        </TorusProvider>
        <GoogleAnalytics gaId="G-7YCMH64Q4J" />
      </ReactQueryProvider>
    </Layout>
  );
}
