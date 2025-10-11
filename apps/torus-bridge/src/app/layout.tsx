import "@torus-ts/ui/globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import "@interchain-ui/react/styles";
import "@solana/wallet-adapter-react-ui/styles.css";
import { Layout } from "@torus-ts/ui/components/layout";
import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { APRBarWrapper } from "~/components/apr-bar-wrapper";
import { AppContextProvider } from "~/context/app-context-provider";
import { env, EnvScript } from "~/env";
import { Fira_Mono as FiraMono } from "next/font/google";

export function generateMetadata() {
  return createSeoMetadata({
    title: "Torus Bridge",
    description:
      "Cross-chain token bridge for the Torus ecosystem. Securely transfer tokens across multiple blockchain networks with ease and reliability.",
    keywords: [
      "cross-chain bridge",
      "token transfer",
      "multi-chain wallet",
      "blockchain interoperability",
      "crypto bridge",
    ],
    ogSiteName: "Torus Bridge",
    canonical: "/",
    baseUrl: env("BASE_URL"),
  });
}

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
      <AppContextProvider>
        <div className="fixed left-0 top-0 z-50 flex w-full justify-end">
          <APRBarWrapper />
        </div>
        {children}
      </AppContextProvider>
    </Layout>
  );
}
