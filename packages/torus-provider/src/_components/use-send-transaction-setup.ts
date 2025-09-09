import type { ApiPromise } from "@polkadot/api";
import type { InjectedExtension } from "@polkadot/extension-inject/types";
import { chainErr } from "@torus-network/torus-utils/error";
import type { Result } from "@torus-network/torus-utils/result";
import { makeErr, makeOk } from "@torus-network/torus-utils/result";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
import { toast } from "@torus-ts/ui/hooks/use-toast";
import { useEffect, useState } from "react";
import type { InjectedAccountWithMeta } from "../torus-provider";
import { getMerkleizedMetadata, updateMetadata } from "../utils/chain-metadata";

/**
 * Sets up wallet connection for transaction signing.
 *
 * @param api - Polkadot API instance
 * @param selectedAccount - The selected wallet account
 * @param web3FromAddress - Function to get wallet injector for an address
 * @returns Promise resolving to wallet setup data or error
 */
const setupWallet = async ({
  api,
  selectedAccount,
  web3FromAddress,
}: {
  api: ApiPromise;
  selectedAccount: InjectedAccountWithMeta;
  web3FromAddress: (address: string) => Promise<InjectedExtension>;
}): Promise<
  Result<{ injector: InjectedExtension; metadataHash: `0x${string}` }, Error>
> => {
  // Get injector from address
  const [injectorError, injector] = await tryAsync(
    web3FromAddress(selectedAccount.address),
  );
  if (injectorError !== undefined) {
    const err = chainErr("Failed to connect to wallet")(injectorError);
    return makeErr(err);
  }

  const [proofError, proof] = await getMerkleizedMetadata(api);
  if (proofError !== undefined) {
    console.error(proofError);
    const err = chainErr("Failed to generate metadata")(proofError);
    return makeErr(err);
  }

  const { metadataHash } = proof;

  return makeOk({ injector, metadataHash });
};

/**
 * Arguments interface for the useWallet hook.
 */
interface UseWalletArgs {
  api: ApiPromise | null;
  selectedAccount: InjectedAccountWithMeta | null;
  web3FromAddress: ((address: string) => Promise<InjectedExtension>) | null;
}

/**
 * Hook for managing wallet connection and metadata setup for transaction signing.
 *
 * @param api - Polkadot API instance
 * @param selectedAccount - Currently selected wallet account
 * @param web3FromAddress - Function to get wallet injector for an address
 * @returns Wallet setup data with injector and metadata hash, or null if not ready
 */
export const useWallet = ({
  api,
  selectedAccount,
  web3FromAddress,
}: UseWalletArgs) => {
  const [wallet, setWallet] = useState<{
    injector: InjectedExtension;
    metadataHash: `0x${string}`;
  } | null>(null);

  useEffect(() => {
    if (!api || !selectedAccount || !web3FromAddress) {
      console.warn("Inconsistent internal state for transaction signing");
      return;
    }

    const run = async () => {
      const [walletSetupError, walletSetup] = await setupWallet({
        api,
        selectedAccount,
        web3FromAddress,
      });
      if (walletSetupError !== undefined) {
        toast.error(
          `Failed to setup wallet for transactions: ${walletSetupError.toString()}`,
        );
        return;
      }

      setWallet(walletSetup);

      const { injector } = walletSetup;

      // Update chain metadata
      // TODO: refactor, do this only once for wallet/app instance
      const [metadataError] = await tryAsync(updateMetadata(api, [injector]));
      if (metadataError !== undefined) {
        toast.error(
          `Failed to update chain metadata: ${metadataError.toString()}`,
        );
      }
    };

    run().catch((e) => {
      toast.error(`Unexpected error setting up wallet: ${e}`);
    });
  }, [api, selectedAccount, web3FromAddress]);

  return wallet;
};
