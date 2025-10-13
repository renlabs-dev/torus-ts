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

/**
 * Produce the SEO metadata for the Torus Bridge page.
 *
 * @returns An object containing page metadata: title, description, keywords, Open Graph site name, canonical path, and base URL derived from environment configuration.
 */
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

/**
 * Wraps page content with the application layout, app context provider, and a fixed APR bar.
 *
 * @param children - The page content to render inside the layout and context provider
 * @returns The composed layout element containing the fixed APR bar and the provided children
 */
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