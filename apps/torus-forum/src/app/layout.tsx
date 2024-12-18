import "../styles/globals.css";

import type { Metadata } from "next";
import { Fira_Mono as FiraMono } from "next/font/google";

import { ToastProvider } from "@torus-ts/toast-provider";
import { TorusProvider } from "@torus-ts/torus-provider";
import { Layout } from "@torus-ts/ui";

import { env } from "~/env";
import { TRPCReactProvider } from "~/trpc/react";
import { ForumHeader } from "./components/forum-header";

export const metadata: Metadata = {
  robots: "all",
  title: "𝐓𝐨𝐫𝐮𝐬",
  icons: [{ rel: "icon", url: "favicon.ico" }],
  description: "Most advanced decentralized AI Protocol.",
};

export const firaMono = FiraMono({
  subsets: ["latin"],
  display: "swap",
  weight: "400",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <Layout font={firaMono}>
      <ToastProvider>
        <TorusProvider
          wsEndpoint={env.NEXT_PUBLIC_WS_PROVIDER_URL}
          torusCacheUrl={env.NEXT_PUBLIC_CACHE_PROVIDER_URL}
        >
          <TRPCReactProvider>
            <ForumHeader />
            {children}
          </TRPCReactProvider>
        </TorusProvider>
      </ToastProvider>
    </Layout>
  );
}
