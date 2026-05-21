"use client";

import { Toaster } from "@torus-ts/ui/components/toaster";
import { EvmWalletProvider } from "~/context/evm-wallet-provider";
import type { PropsWithChildren } from "react";
import { useEffect, useState } from "react";

export function AppContextProvider({ children }: Readonly<PropsWithChildren>) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <EvmWalletProvider>
      {children}
      <Toaster />
    </EvmWalletProvider>
  );
}
