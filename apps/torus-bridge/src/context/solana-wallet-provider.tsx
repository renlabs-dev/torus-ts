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
import { logger } from "~/utils/logger";
import type { PropsWithChildren } from "react";
import { useCallback, useMemo } from "react";
import { trySync } from "@torus-network/torus-utils/try-catch";

export function SolanaWalletProvider({
  children,
}: Readonly<PropsWithChildren<unknown>>) {
  // TODO support multiple networks
  const network = WalletAdapterNetwork.Mainnet;

  const endpoint = useMemo(() => {
    const [endpointError, result] = trySync(() => clusterApiUrl(network));

    if (endpointError !== undefined) {
      console.error("Error getting cluster API URL:", endpointError);
      // Return a fallback endpoint or throw based on requirements
      return "https://api.mainnet-beta.solana.com"; // Fallback to a default endpoint
    }

    return result;
  }, [network]);

  const wallets = useMemo(
    () => {
      const [walletsError, walletsList] = trySync(() => [
        // new PhantomWalletAdapter(),
        // new SolflareWalletAdapter(),
        // new BackpackWalletAdapter(),
        // new SalmonWalletAdapter(),
        // new SnapWalletAdapter(),
        // new TrustWalletAdapter(),
        new LedgerWalletAdapter(),
      ]);

      if (walletsError !== undefined) {
        console.error("Error initializing Solana wallets:", walletsError);
        return [];
      }

      return walletsList;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [network],
  );

  const onError = useCallback((error: WalletError) => {
    logger.error("Error initializing Solana wallet provider", error);
  }, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} onError={onError} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
