import "../styles/globals.css";

import type { Metadata } from "next";

import { TorusProvider } from "@torus-ts/torus-provider";
import { Footer, Layout } from "@torus-ts/ui";

import { TRPCReactProvider } from "~/trpc/react";

import { Fira_Mono as FiraMono } from "next/font/google";
import { EnvScript, env } from "~/env";
import { ToastProvider } from "@torus-ts/toast-provider";
import { AllocatorHeader } from "./components/allocator-header";
import { AllocationMenu } from "./components/allocation-menu";

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
  return (
    <Layout
      font={firaMono}
      headScripts={[EnvScript]}
      className="bg-[url(/background.svg)]"
    >
      <ToastProvider>
        <TorusProvider
          wsEndpoint={env("NEXT_PUBLIC_TORUS_RPC_URL")}
          torusCacheUrl={env("NEXT_PUBLIC_TORUS_CACHE_URL")}
        >
          <TRPCReactProvider>
            <AllocatorHeader />

            <AllocationMenu />
            {children}
            <Footer />
          </TRPCReactProvider>
        </TorusProvider>
      </ToastProvider>
    </Layout>
  );
}
