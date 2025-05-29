import "@torus-ts/ui/globals.css";

import { GoogleAnalytics } from "@next/third-parties/google";
import { ReactQueryProvider } from "@torus-ts/query-provider";
import { TorusProvider } from "@torus-ts/torus-provider";
import { Container } from "@torus-ts/ui/components/container";
import { Footer } from "@torus-ts/ui/components/footer";
import { Layout } from "@torus-ts/ui/components/layout";
import { Seo, createSeoMetadata } from "@torus-ts/ui/components/seo";
import { Toaster } from "@torus-ts/ui/components/toaster";
import { UsdPriceProvider } from "~/context/usd-price-provider";
import { WalletProvider } from "~/context/wallet-provider";
import { EnvScript, env } from "~/env";
import { firaMono } from "~/utils/fonts";
import { APRBar } from "./_components/apr-bar/apr-bar";
import { SidebarLinks } from "./_components/sidebar-links";
import { WalletBalance } from "./_components/wallet-balance";
import { WalletHeader } from "./_components/wallet-header";

// export const metadata = createSeoMetadata({
//   title: "Torus Wallet - Secure Digital Asset Management",
//   description:
//     "Simple, secure, and easy-to-use wallet for the torus ecosystem. Manage your digital assets with confidence using our industry-leading security features.",
//   keywords: ["crypto wallet", "torus", "blockchain", "digital assets", "web3"],
//   baseUrlFn: () => env("BASE_URL"),
//   canonical: "/",
// });

interface ProvidersProps {
  children: React.ReactNode;
  wsEndpoint: string;
  torusCacheUrl: string;
}

const Providers: React.FC<ProvidersProps> = ({
  children,
  wsEndpoint,
  torusCacheUrl,
}) => (
  <TorusProvider wsEndpoint={wsEndpoint} torusCacheUrl={torusCacheUrl}>
    <ReactQueryProvider>
      <WalletProvider>
        <UsdPriceProvider>{children}</UsdPriceProvider>
      </WalletProvider>
    </ReactQueryProvider>
  </TorusProvider>
);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Layout font={firaMono} headScripts={[EnvScript]}>
      <Seo ogImageAlt="Torus Wallet" />

      <Providers
        wsEndpoint={env("NEXT_PUBLIC_TORUS_RPC_URL")}
        torusCacheUrl={env("NEXT_PUBLIC_TORUS_CACHE_URL")}
      >
        <WalletHeader />
        <APRBar />
        <Container>
          <main className="mx-auto flex min-w-full flex-col items-center gap-3 text-white">
            <div
              className="flex w-full max-w-screen-xl flex-col justify-around gap-4 lg:mt-[10vh]
                lg:flex-row"
            >
              <div className="animate-fade flex w-full flex-col gap-4 lg:max-w-[320px]">
                <SidebarLinks />
                <WalletBalance />
              </div>
              {children}
              <div className="mb-20 lg:hidden" />
            </div>
          </main>
        </Container>
        <Toaster />
      </Providers>
      <Footer torusChainEnv={env("NEXT_PUBLIC_TORUS_CHAIN_ENV")} />
      <GoogleAnalytics gaId={env("NEXT_PUBLIC_TORUS_GA_ID")} />
    </Layout>
  );
}
