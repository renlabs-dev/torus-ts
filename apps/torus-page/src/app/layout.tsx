import "../styles/globals.css";

import type { Metadata } from "next";
import { Fira_Mono as FiraMono } from "next/font/google";

import { Layout } from "@torus-ts/ui";
import { HoverHeader } from "./components/hover-header";
import { EnvScript } from "~/env";
import { Footer } from "./components/footer";

const APP_NAME = "Torus";

export const metadata: Metadata = {
  robots: "all",
  title: APP_NAME,
  icons: [{ rel: "icon", url: "favicon.ico" }],
  description: "The thermodynamic god's favorite child.",
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
    <Layout font={firaMono} torusPage headScripts={[EnvScript]}>
      <HoverHeader />
      {children}
      <Footer />
    </Layout>
  );
}
