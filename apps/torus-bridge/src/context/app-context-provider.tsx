"use client";

import "@torus-ts/ui/globals.css";
import { ReactQueryProvider } from "@torus-ts/query-provider";
import { ToastProvider } from "@torus-ts/toast-provider";
import { TorusProvider } from "@torus-ts/torus-provider";
import { Container } from "@torus-ts/ui/components/container";
import { Footer } from "@torus-ts/ui/components/footer";
import { WalletHeader } from "~/app/_components/shared/wallet-header";
import { CosmosWalletProvider } from "~/context/cosmos-wallet-provider";
import { EvmWalletProvider } from "~/context/evm-wallet-provider";
import { SolanaWalletProvider } from "~/context/solana-wallet-provider";
import { WarpContextInitGateProvider } from "~/context/warp-context-init-gate-provider";
import { env } from "~/env";

export function AppContextProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
  return (
    <ToastProvider>
      <ReactQueryProvider>
        <TorusProvider
          wsEndpoint={env("NEXT_PUBLIC_TORUS_RPC_URL")}
          torusCacheUrl={env("NEXT_PUBLIC_TORUS_CACHE_URL")}
        >
          <WarpContextInitGateProvider>
            <EvmWalletProvider>
              <SolanaWalletProvider>
                <CosmosWalletProvider>
                  <WalletHeader />
                  <Container>{children}</Container>
                  <Footer />
                </CosmosWalletProvider>
              </SolanaWalletProvider>
            </EvmWalletProvider>
          </WarpContextInitGateProvider>
        </TorusProvider>
      </ReactQueryProvider>
    </ToastProvider>
  );
}
