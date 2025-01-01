import "../styles/globals.css";

import type { Metadata } from "next";
import { Fira_Mono as FiraMono } from "next/font/google";

import { Footer, Layout } from "@torus-ts/ui";
import { HoverHeader } from "./components/hover-header";

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
    <Layout font={firaMono} appName={APP_NAME}>
      <HoverHeader />
      {children}
      <div className="absolute bottom-0 mb-8 w-full animate-fade-up text-center text-gray-200 animate-delay-700">
        <h3>Bridge Closed. Total Bridged: 65M $TOR</h3>
      </div>
      <Footer />
    </Layout>
  );
}
