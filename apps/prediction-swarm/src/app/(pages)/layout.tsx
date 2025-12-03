import "../globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";
import { ReactQueryProvider } from "@torus-ts/query-provider";
import { TorusProvider } from "@torus-ts/torus-provider";
import { Layout } from "@torus-ts/ui/components/layout";
import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { Toaster } from "@torus-ts/ui/components/toaster";
import { env, EnvScript } from "~/env";
import { TRPCReactProvider } from "~/trpc/react";
import { Geist_Mono as GeistMono } from "next/font/google";
import { SearchPredictorCommand } from "../_components/search-predictor-command/search-predictor-command";

const APP_NAME = "Prediction Swarm";

export function generateMetadata() {
  return createSeoMetadata({
    title: APP_NAME,
    description:
      "From cells to societies, intelligence emerges through nested agency. The swarm applies this principle to predictions, mapping who to trust and when, turning uncertainty into clarity.",
    keywords: [
      "torus portal",
      "prediction swarm",
      "decentralized predictions",
      "collective intelligence",
      "web3 predictions",
      "torus network",
      "torus",
      "prediction",
      "swarm",
    ],
    ogSiteName: APP_NAME,
    canonical: "/",
    baseUrl: env("BASE_URL"),
    ogImagePath: "/og.jpg",
  });
}

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
            <SearchPredictorCommand />
            <Toaster />
          </TRPCReactProvider>
        </TorusProvider>
        <GoogleAnalytics gaId="G-7YCMH64Q4J" />
      </ReactQueryProvider>
    </Layout>
  );
}
