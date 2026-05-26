import "@torus-ts/ui/globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import { TorusProvider } from "@torus-ts/torus-provider";
import { Footer } from "@torus-ts/ui/components/footer";
import { Layout } from "@torus-ts/ui/components/layout";
import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { AppContextProvider } from "~/context/app-context-provider";
import { env } from "~/env";
import { Fira_Mono as FiraMono } from "next/font/google";
import { WalletHeader } from "./_components/header";

export const firaMono = FiraMono({
  subsets: ["latin"],
  display: "swap",
  weight: "400",
});

export function generateMetadata() {
  return createSeoMetadata({
    title: "Torus Base Migration Claim",
    description:
      "Claim your TORUS migration allocation on TorusEVM. Verify your eligibility and receive your tokens directly to your connected wallet.",
    keywords: [
      "torus migration",
      "claim tokens",
      "merkle claim",
      "token migration",
    ],
    ogSiteName: "Torus Base Migration Claim",
    canonical: "/",
    baseUrl: "https://bridge.torus.network/claim",
  });
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <Layout font={firaMono}>
      <AppContextProvider>
        <TorusProvider
          wsEndpoint={env("NEXT_PUBLIC_TORUS_RPC_URL")}
          torusCacheUrl={env("NEXT_PUBLIC_TORUS_CACHE_URL")}
        >
          <WalletHeader />
          {children}
          <Footer torusChainEnv={env("NEXT_PUBLIC_TORUS_CHAIN_ENV")} />
        </TorusProvider>
      </AppContextProvider>
    </Layout>
  );
}
