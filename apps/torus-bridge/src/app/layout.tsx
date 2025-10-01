import "@torus-ts/ui/globals.css";
import "@rainbow-me/rainbowkit/styles.css";
import "@interchain-ui/react/styles";
import "@solana/wallet-adapter-react-ui/styles.css";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@torus-ts/ui/components/alert";
import { Layout } from "@torus-ts/ui/components/layout";
import { createSeoMetadata } from "@torus-ts/ui/components/seo";
import { AppContextProvider } from "~/context/app-context-provider";
import { env, EnvScript } from "~/env";
import { AlertCircleIcon } from "lucide-react";
import { Fira_Mono as FiraMono } from "next/font/google";

// import { WalletConflictGuard } from "./_components/wallet-conflict-guard";

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
      {/* <WalletConflictGuard> */}
      <AppContextProvider>
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>We are having some issues with the EVM Layer.</AlertTitle>
          <AlertDescription>
            <p>
              The bridge is disabled for now. We are working hard to resolve the
              issue. Thank you for your patience.
            </p>
          </AlertDescription>
        </Alert>
        {children}
      </AppContextProvider>
      {/* </WalletConflictGuard> */}
    </Layout>
  );
}
