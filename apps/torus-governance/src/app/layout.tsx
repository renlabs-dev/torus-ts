import "@torus-ts/ui/globals.css";
import DiscordAuthProvider from "./providers/auth-provider";
import { GoogleAnalytics } from "@next/third-parties/google";
import { TorusProvider } from "@torus-ts/torus-provider";
import { Container } from "@torus-ts/ui/components/container";
import { Footer } from "@torus-ts/ui/components/footer";
import { Layout } from "@torus-ts/ui/components/layout";
import { Toaster } from "@torus-ts/ui/components/toaster";
import type { Metadata } from "next";
import { Fira_Mono as FiraMono } from "next/font/google";
import { GovernanceProvider } from "~/context/governance-provider";
import { env, EnvScript } from "~/env";
import { TRPCReactProvider } from "~/trpc/react";

const APP_NAME = "Torus DAO";

export const metadata: Metadata = {
  robots: "all",
  title: APP_NAME,
  icons: [{ rel: "icon", url: "favicon.ico" }],
  description: "The thermodynamic god's favorite DAO.",
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
      <TorusProvider
        wsEndpoint={env("NEXT_PUBLIC_TORUS_RPC_URL")}
        torusCacheUrl={env("NEXT_PUBLIC_TORUS_CACHE_URL")}
      >
        <TRPCReactProvider>
          <GovernanceProvider>
            <DiscordAuthProvider>
              <Container>{children}</Container>
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
