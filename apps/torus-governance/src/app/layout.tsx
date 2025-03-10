import "@torus-ts/ui/globals.css";
<<<<<<< HEAD
import DiscordAuthProvider from "./providers/auth-provider";
=======
import AuthProvider from "./providers/auth-provider";
>>>>>>> 701128fe (add discord login button)
import { TorusProvider } from "@torus-ts/torus-provider";
import { Container } from "@torus-ts/ui/components/container";
import { Footer } from "@torus-ts/ui/components/footer";
import { Layout } from "@torus-ts/ui/components/layout";
import { Toaster } from "@torus-ts/ui/components/toaster";
import type { Metadata } from "next";
import { Fira_Mono as FiraMono } from "next/font/google";
import { GovernanceProvider } from "~/context/governance-provider";
import { env, EnvScript } from "~/env";
import { TRPCReactProvider } from "~/trpc/react";

const APP_NAME = "Torus DAO";

export const metadata: Metadata = {
  robots: "all",
  title: APP_NAME,
  icons: [{ rel: "icon", url: "favicon.ico" }],
  description: "The thermodynamic god's favorite DAO.",
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
      <TorusProvider
        wsEndpoint={env("NEXT_PUBLIC_TORUS_RPC_URL")}
        torusCacheUrl={env("NEXT_PUBLIC_TORUS_CACHE_URL")}
      >
        <TRPCReactProvider>
          <GovernanceProvider>
<<<<<<< HEAD
            <DiscordAuthProvider>
              <Container>{children}</Container>
              <Footer />
              <Toaster />
            </DiscordAuthProvider>
=======
            <AuthProvider>
              <Container>{children}</Container>
              <Footer />
              <Toaster />
            </AuthProvider>
>>>>>>> 701128fe (add discord login button)
          </GovernanceProvider>
        </TRPCReactProvider>
      </TorusProvider>
    </Layout>
  );
}
