import "@torus-ts/ui/globals.css";
import { AllocationSheet } from "./_components/allocation-sheet";
import { AllocatorHeader } from "./_components/allocator-header";
import { TutorialDialog } from "./_components/tutorial-dialog";
import { TorusProvider } from "@torus-ts/torus-provider";
import { Footer } from "@torus-ts/ui/components/footer";
import { Layout } from "@torus-ts/ui/components/layout";
import { Toaster } from "@torus-ts/ui/components/toaster";
import type { Metadata } from "next";
import { Fira_Mono as FiraMono } from "next/font/google";
import { EnvScript, env } from "~/env";
import { TRPCReactProvider } from "~/trpc/react";

const APP_NAME = "Allocator";

export const metadata: Metadata = {
  robots: "all",
  title: APP_NAME,
  icons: [{ rel: "icon", url: "favicon.ico" }],
  description: "The thermodynamic god's favorite Allocator.",
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
  const torusCacheUrl = env("NEXT_PUBLIC_TORUS_CACHE_URL");
  return (
    <Layout font={firaMono} headScripts={[EnvScript]}>
      <TorusProvider
        wsEndpoint={env("NEXT_PUBLIC_TORUS_RPC_URL")}
        torusCacheUrl={env("NEXT_PUBLIC_TORUS_CACHE_URL")}
      >
        <TRPCReactProvider>
          <AllocatorHeader torusCacheUrl={torusCacheUrl} />
          <TutorialDialog />
          <AllocationSheet />
          {children}
          <Toaster />
          <Footer torusChainEnv={env("NEXT_PUBLIC_TORUS_CHAIN_ENV")} />
        </TRPCReactProvider>
      </TorusProvider>
    </Layout>
  );
}
