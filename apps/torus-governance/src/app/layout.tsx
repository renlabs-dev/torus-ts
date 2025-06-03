import "@torus-ts/ui/globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";
import { TorusProvider } from "@torus-ts/torus-provider";
import { Footer } from "@torus-ts/ui/components/footer";
import { Layout } from "@torus-ts/ui/components/layout";
import { Seo, createSeoMetadata } from "@torus-ts/ui/components/seo";
import { Toaster } from "@torus-ts/ui/components/toaster";
import { GovernanceProvider } from "~/context/governance-provider";
import { env, EnvScript } from "~/env";
import { TRPCReactProvider } from "~/trpc/react";
import type { Metadata } from "next";
import { Fira_Mono as FiraMono } from "next/font/google";
import DiscordAuthProvider from "../context/auth-provider";

const APP_NAME = "Torus DAO";

export const metadata = () => 
  createSeoMetadata({
    title: "Torus DAO - Decentralized Governance",
    description: "Participate in the governance of Torus Network. Vote on proposals, create initiatives, and help shape the future of the network.",
    keywords: ["torus dao", "torus governance", "torus network", "blockchain governance", "dao voting"],
    baseUrl: env("BASE_URL"),
    canonical: "/",
  });

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
      <TorusProvider
        wsEndpoint={env("NEXT_PUBLIC_TORUS_RPC_URL")}
        torusCacheUrl={env("NEXT_PUBLIC_TORUS_CACHE_URL")}
      >
        <TRPCReactProvider>
          <GovernanceProvider>
            <DiscordAuthProvider>
              {/* The Seo component in the layout provides default OG image. 
                  Pages with dynamic metadata will override these values */}
              <Seo ogImageAlt="Torus DAO" ogImageUrl={`${env("BASE_URL")}/og.png`} />
              {children}
              <Footer torusChainEnv={env("NEXT_PUBLIC_TORUS_CHAIN_ENV")} />
              <Toaster />
            </DiscordAuthProvider>
          </GovernanceProvider>
        </TRPCReactProvider>
      </TorusProvider>
      <GoogleAnalytics gaId="G-7YCMH64Q4J" />
    </Layout>
  );
}
