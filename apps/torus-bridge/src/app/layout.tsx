import "@torus-ts/ui/globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import "@interchain-ui/react/styles";
import "@solana/wallet-adapter-react-ui/styles.css";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Layout } from "@torus-ts/ui/components/layout";
import { AppContextProvider } from "~/context/app-context-provider";
import { EnvScript, env } from "~/env";
import { Fira_Mono as FiraMono } from "next/font/google";
import { Seo, createSeoMetadata } from "@torus-ts/ui/components/seo";

export const generateMetadata = () =>
  createSeoMetadata({
    title: "Torus Base Bridge",
    description: "Secure Cross-Chain Transfers with Torus Bridge",
    keywords: [
      "torus bridge",
      "cross-chain bridge",
      "token bridge",
      "blockchain bridge",
      "crypto bridge",
      "multi-chain transfers",
      "secure asset transfer",
      "interoperability protocol",
      "cross-chain interoperability",
      "substrate bridge",
      "torus network bridge",
    ],
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
  return (
    <Layout font={firaMono} headScripts={[EnvScript]}>
      <Seo />
      <AppContextProvider>{children}</AppContextProvider>
      <GoogleAnalytics gaId={env("NEXT_PUBLIC_GA_ID")} />
    </Layout>
  );
}
