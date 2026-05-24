"use client";

import { Toaster } from "@torus-ts/ui/components/toaster";
import { EvmWalletProvider } from "~/context/evm-wallet-provider";
import type { PropsWithChildren } from "react";

export function AppContextProvider({ children }: Readonly<PropsWithChildren>) {
  return (
    <EvmWalletProvider>
      {children}
      <Toaster />
    </EvmWalletProvider>
  );
}
