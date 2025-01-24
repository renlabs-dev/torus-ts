import "../styles/globals.css";
import type { Metadata } from "next";
import { Fira_Mono as FiraMono } from "next/font/google";
import { Container, Footer, Layout } from "@torus-ts/ui/components";

const APP_NAME = "Staking";

export const metadata: Metadata = {
  robots: "all",
  title: APP_NAME,
  icons: [{ rel: "icon", url: "favicon.ico" }],
  description: "Simple application layout example",
};

const firaMono = FiraMono({
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
      <Container>{children}</Container>
      <Footer />
    </Layout>
  );
}
