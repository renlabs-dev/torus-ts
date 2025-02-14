import "@solana/wallet-adapter-react-ui/styles.css";

import type { WalletError } from "@solana/wallet-adapter-base";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  // BackpackWalletAdapter,
  LedgerWalletAdapter,
  // PhantomWalletAdapter,
  // SalmonWalletAdapter,
  // SolflareWalletAdapter,
  // TrustWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import type { PropsWithChildren } from "react";
import { useCallback, useMemo } from "react";
import { toast } from "react-toastify";

import { logger } from "~/utils/logger";

export function SolanaWalletProvider({ children }: PropsWithChildren<unknown>) {
  // TODO support multiple networks
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(
    () => [
      // new PhantomWalletAdapter(),
      // new SolflareWalletAdapter(),
      // new BackpackWalletAdapter(),
      // new SalmonWalletAdapter(),
      // new SnapWalletAdapter(),
      // new TrustWalletAdapter(),
      new LedgerWalletAdapter(),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [network],
  );

  const onError = useCallback((error: WalletError) => {
    logger.error("Error initializing Solana wallet provider", error);
    toast.error("Error preparing Solana wallet");
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} onError={onError} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
