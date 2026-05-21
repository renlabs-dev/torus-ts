import "@torus-ts/ui/globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import { Layout } from "@torus-ts/ui/components/layout";
import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { AppContextProvider } from "~/context/app-context-provider";
import { Fira_Mono as FiraMono } from "next/font/google";

const firaMono = FiraMono({
  subsets: ["latin"],
  display: "swap",
  weight: "400",
});

export function generateMetadata() {
  return createSeoMetadata({
    title: "Torus Migration Claim",
    description:
      "Claim your TORUS migration allocation on TorusEVM. Verify your eligibility and receive your tokens directly to your connected wallet.",
    keywords: [
      "torus migration",
      "claim tokens",
      "merkle claim",
      "token migration",
    ],
    ogSiteName: "Torus Migration Claim",
    canonical: "/",
    baseUrl: "https://claim.torus.network",
  });
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <Layout font={firaMono}>
      <nav className="border-border flex w-full items-center gap-6 border-b px-6 py-4">
        <span className="text-foreground text-sm font-medium">Torus</span>
        <div className="flex gap-4 text-sm">
          <a href="/claim" className="text-foreground hover:text-foreground/80">
            Claim
          </a>
          <span className="text-muted-foreground">Bridge</span>
        </div>
      </nav>
      <AppContextProvider>{children}</AppContextProvider>
    </Layout>
  );
}
