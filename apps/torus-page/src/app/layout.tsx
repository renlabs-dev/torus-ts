import { Layout } from "@torus-ts/ui/components/layout";
import "@torus-ts/ui/globals.css";
import { Footer } from "./components/footer";
import { HoverHeader } from "./components/hover-header";
import { Providers } from "./components/providers";
import type { Metadata } from "next";
import { Fira_Mono as FiraMono } from "next/font/google";
import { EnvScript } from "~/env";

export const metadata: Metadata = {
  robots: "all",
  title: "Torus",
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
}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
  return (
    <Layout font={firaMono} headScripts={[EnvScript]}>
      <Providers>
        <HoverHeader />
        {children}
        <Footer />
      </Providers>
    </Layout>
  );
}
