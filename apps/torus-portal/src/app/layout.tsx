import "@torus-ts/ui/globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";
import { TorusProvider } from "@torus-ts/torus-provider";
import { Footer } from "@torus-ts/ui/components/footer";
import { Layout } from "@torus-ts/ui/components/layout";
import { Toaster } from "@torus-ts/ui/components/toaster";
import { env, EnvScript } from "~/env";
import type { Metadata } from "next";
import { Fira_Mono as FiraMono } from "next/font/google";
import { PortalHeader } from "./_components/portal-header";
import { ReactQueryProvider } from "@torus-ts/query-provider";
import { TRPCReactProvider } from "~/trpc/react";

const APP_NAME = "Torus Portal";

export const metadata: Metadata = {
  robots: "all",
  title: APP_NAME,
  icons: [{ rel: "icon", url: "favicon.ico" }],
  description: "The thermodynamic god's favorite Portal.",
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
          <TRPCReactProvider>
            <PortalHeader torusCacheUrl={env("NEXT_PUBLIC_TORUS_CACHE_URL")} />
            {children}
            <Toaster />
            <Footer torusChainEnv={env("NEXT_PUBLIC_TORUS_CHAIN_ENV")} />

            <GoogleAnalytics gaId="G-7YCMH64Q4J" />
          </TRPCReactProvider>
        </TorusProvider>
      </ReactQueryProvider>
    </Layout>
  );
}
