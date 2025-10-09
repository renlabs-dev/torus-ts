import "@torus-ts/ui/globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";
import { ReactQueryProvider } from "@torus-ts/query-provider";
import { TorusProvider } from "@torus-ts/torus-provider";
import { Layout } from "@torus-ts/ui/components/layout";
import { Toaster } from "@torus-ts/ui/components/toaster";
import { AuthProvider } from "~/contexts/auth-provider";
import { env, EnvScript } from "~/env";
import { QueryProvider } from "~/lib/query-client";
import type { Metadata } from "next";
import { Fira_Mono as FiraMono } from "next/font/google";
import { ProphetFinderHeader } from "./_components/prophet-finder-header";

const APP_NAME = "Torus Prediction Swarm";

export const metadata: Metadata = {
  robots: "all",
  title: APP_NAME,
  icons: [{ rel: "icon", url: "favicon.ico" }],
  description:
    "Join the Torus Prediction Swarm: a decentralized network of AI agents that detect, verify, and store online predictions. Explore verifiable forecasts about tech, AI, crypto, and more.",
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
          {/* <QueryProvider> */}
          <AuthProvider>{children}</AuthProvider>
          {/* </QueryProvider> */}
          <Toaster />
        </TorusProvider>
        <GoogleAnalytics gaId="G-7YCMH64Q4J" />
      </ReactQueryProvider>
    </Layout>
  );
}
