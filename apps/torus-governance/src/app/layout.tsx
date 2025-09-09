import "@torus-ts/ui/globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";
import { TorusProvider } from "@torus-ts/torus-provider";
import { Footer } from "@torus-ts/ui/components/footer";
import { Layout } from "@torus-ts/ui/components/layout";
import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { Toaster } from "@torus-ts/ui/components/toaster";
import { GovernanceProvider } from "~/context/governance-provider";
import { env, EnvScript } from "~/env";
import { TRPCReactProvider } from "~/trpc/react";
import PlausibleProvider from "next-plausible";
import { Fira_Mono as FiraMono } from "next/font/google";
import DiscordAuthProvider from "../context/auth-provider";

export function generateMetadata() {
  return createSeoMetadata({
    title: "Torus DAO",
    description:
      "Decentralized governance platform for the Torus Network. Participate in DAO decisions, vote on proposals, and shape the future of decentralized infrastructure.",
    keywords: [
      "torus dao",
      "decentralized governance",
      "blockchain voting",
      "community decision-making",
      "web3 governance",
    ],
    ogSiteName: "Torus DAO",
    canonical: "/",
    baseUrl: env("BASE_URL"),
  });
}

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
    <PlausibleProvider
      domain="dao.torus.network,rollup.torus.network"
      trackOutboundLinks
    >
      <Layout font={firaMono} headScripts={[EnvScript]}>
        <TorusProvider
          wsEndpoint={env("NEXT_PUBLIC_TORUS_RPC_URL")}
          torusCacheUrl={env("NEXT_PUBLIC_TORUS_CACHE_URL")}
        >
          <TRPCReactProvider>
            <GovernanceProvider>
              <DiscordAuthProvider>
                {children}
                <Footer torusChainEnv={env("NEXT_PUBLIC_TORUS_CHAIN_ENV")} />
                <Toaster />
              </DiscordAuthProvider>
            </GovernanceProvider>
          </TRPCReactProvider>
        </TorusProvider>
        <GoogleAnalytics gaId="G-7YCMH64Q4J" />
      </Layout>
    </PlausibleProvider>
  );
}
