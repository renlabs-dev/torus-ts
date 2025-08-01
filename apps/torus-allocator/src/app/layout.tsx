import "@torus-ts/ui/globals.css";

import { GoogleAnalytics } from "@next/third-parties/google";

import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { env } from "~/env";
import { Fira_Mono as FiraMono } from "next/font/google";

import { Layout } from "@torus-ts/ui/components/layout";

import { EnvScript } from "~/env";

export const metadata = createSeoMetadata({
  title: "Torus Allocator",
  description: "Torus Network agent allocation platform. Manage and distribute network resources through a comprehensive allocation interface.",
  keywords: ["agent allocation", "network resources", "weight management", "torus network", "resource distribution"],
  ogSiteName: "Torus Allocator",
  canonical: "/",
  baseUrl: env("BASE_URL"),
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
      {children}
      <GoogleAnalytics gaId="G-7YCMH64Q4J" />
    </Layout>
  );
}
