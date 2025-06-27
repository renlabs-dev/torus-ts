"use client";

import type { WalletError } from "@solana/wallet-adapter-base";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { LedgerWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import { logger } from "~/utils/logger";
import type { PropsWithChildren } from "react";
import { useCallback, useMemo, useState, useEffect } from "react";
import { trySync } from "@torus-network/torus-utils/try-catch";

export function SolanaWalletProvider({
  children,
}: Readonly<PropsWithChildren<unknown>>) {
  // Add client-side rendering check
  const [hasMounted, setHasMounted] = useState(false);

  // Effect to run after client-side mounting
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // TODO support multiple networks
  const network = WalletAdapterNetwork.Mainnet;

  const endpoint = useMemo(() => {
    if (!hasMounted) return "https://api.mainnet-beta.solana.com"; // Default during SSR

    const [endpointError, result] = trySync(() => clusterApiUrl(network));
    if (endpointError !== undefined) {
      console.error("Error getting cluster API URL:", endpointError);
      // Return a fallback endpoint or throw based on requirements
      return "https://api.mainnet-beta.solana.com"; // Fallback to a default endpoint
    }
    return result;
  }, [network, hasMounted]);

  const wallets = useMemo(
    () => {
      if (!hasMounted) return []; // Return empty array during SSR

      const [walletsError, walletsList] = trySync(() => [
        new LedgerWalletAdapter(),
      ]);
      if (walletsError !== undefined) {
        console.error("Error initializing Solana wallets:", walletsError);
        return [];
      }
      return walletsList;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [network, hasMounted],
  );

  const onError = useCallback((error: WalletError) => {
    logger.error("Error initializing Solana wallet provider", error);
  }, []);

  // Render a simplified version during server-side rendering
  if (!hasMounted) {
    // Return a simplified version or null during SSR
    return <>{children}</>;
  }

  // Full client-side render
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} onError={onError} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
