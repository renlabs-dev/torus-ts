import "@torus-ts/ui/globals.css";

import { GoogleAnalytics } from "@next/third-parties/google";
import { Layout } from "@torus-ts/ui/components/layout";
import { Seo, createSeoMetadata } from "@torus-ts/ui/components/seo";
import { Fira_Mono as FiraMono } from "next/font/google";
import type { ReactNode } from "react";
import { EnvScript, env } from "~/env";
import { Footer } from "./_components/footer";
import { HoverHeader } from "./_components/hover-header";

export const generateMetadata = () =>
  createSeoMetadata({
    title: "Torus Network",
    description: "The thermodynamic god's favorite child.",
    keywords: ["torus page", "torus site"],
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
  children: ReactNode;
}>) {
  return (
    <Layout font={firaMono} headScripts={[EnvScript]}>
      <Seo />
      <HoverHeader />
      {children}
      <Footer />
      <GoogleAnalytics gaId={env("NEXT_PUBLIC_GA_ID")} />
    </Layout>
  );
}
