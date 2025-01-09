"use client";

import "../styles/globals.css";

import { CosmosWalletProvider } from "~/context/cosmos-wallet-provider";
import { EvmWalletProvider } from "~/context/evm-wallet-provider";
import { WarpContextInitGateProvider } from "~/context/warp-context-init-gate-provider";

import { ToastProvider } from "@torus-ts/toast-provider";
import { ReactQueryProvider } from "@torus-ts/query-provider";

import { SolanaWalletProvider } from "~/context/solana-wallet-provider";
import { TorusProvider } from "@torus-ts/torus-provider";
import { env } from "~/env";
import { WalletHeader } from "~/app/_components/shared/wallet-header";

export function AppContextProvider({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <ToastProvider>
      <ReactQueryProvider>
        <TorusProvider
          wsEndpoint={env.NEXT_PUBLIC_TORUS_RPC_URL}
          torusCacheUrl={env.NEXT_PUBLIC_TORUS_CACHE_URL}
        >
          <WarpContextInitGateProvider>
            <EvmWalletProvider>
              <SolanaWalletProvider>
                <CosmosWalletProvider>
                  <WalletHeader />
                  {children}
                </CosmosWalletProvider>
              </SolanaWalletProvider>
            </EvmWalletProvider>
          </WarpContextInitGateProvider>
        </TorusProvider>
      </ReactQueryProvider>
    </ToastProvider>
  );
}
