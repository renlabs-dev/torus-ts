import "@torus-ts/ui/globals.css";
import { GoogleAnalytics } from "@next/third-parties/google";
import { TorusProvider } from "@torus-ts/torus-provider";
import { Footer } from "@torus-ts/ui/components/footer";
import { Layout } from "@torus-ts/ui/components/layout";
import { Seo, createSeoMetadata } from "@torus-ts/ui/components/seo";
import { Toaster } from "@torus-ts/ui/components/toaster";
import { env, EnvScript } from "~/env";
import { TRPCReactProvider } from "~/trpc/react";
import { Fira_Mono as FiraMono } from "next/font/google";
import { AllocationSheet } from "./_components/allocation-sheet";
import { AllocatorHeader } from "./_components/allocator-header";
import { TutorialDialog } from "./_components/tutorial-dialog";

export const metadata = () =>
  createSeoMetadata({
    title: "Torus Allocator - Delegate Stake to Agents",
    description:
      "Discover and allocate your stake to Torus Network agents. Participate in the decentralized reward system and help shape the Torus ecosystem.",
    keywords: [
      "torus allocator",
      "torus network",
      "stake delegation",
      "torus agents",
      "blockchain delegation",
    ],
    ogSiteName: "Torus Allocator",
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
  const torusCacheUrl = env("NEXT_PUBLIC_TORUS_CACHE_URL");
  return (
    <Layout font={firaMono} headScripts={[EnvScript]}>
      <TorusProvider
        wsEndpoint={env("NEXT_PUBLIC_TORUS_RPC_URL")}
        torusCacheUrl={env("NEXT_PUBLIC_TORUS_CACHE_URL")}
      >
        <TRPCReactProvider>
          {/* The Seo component in the layout provides default OG image.
              Pages with dynamic metadata will override these values */}
          <Seo
            ogImageAlt="Torus Allocator"
            ogImageUrl={`${env("BASE_URL")}/og.png`}
          />
          <AllocatorHeader torusCacheUrl={torusCacheUrl} />
          <TutorialDialog />
          <AllocationSheet />
          {children}
          <Toaster />
          <Footer torusChainEnv={env("NEXT_PUBLIC_TORUS_CHAIN_ENV")} />
        </TRPCReactProvider>
      </TorusProvider>
      <GoogleAnalytics gaId="G-7YCMH64Q4J" />
    </Layout>
  );
}
