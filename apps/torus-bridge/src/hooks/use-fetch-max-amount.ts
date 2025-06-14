import type {
  ChainName,
  MultiProtocolProvider,
  TokenAmount,
  WarpCore,
} from "@hyperlane-xyz/sdk";
import type { ProtocolType } from "@hyperlane-xyz/utils";
import type { AccountInfo } from "@hyperlane-xyz/widgets";
import { getAccountAddressAndPubKey } from "@hyperlane-xyz/widgets";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { useMultiProvider } from "~/hooks/use-multi-provider";
import { logger } from "../utils/logger";
import { useWarpCore } from "./token";
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";

interface FetchMaxParams {
  accounts: Record<ProtocolType, AccountInfo>;
  balance: TokenAmount;
  origin: ChainName;
  destination: ChainName;
}

export function useFetchMaxAmount() {
  const multiProvider = useMultiProvider();
  const warpCore = useWarpCore();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (params: FetchMaxParams) =>
      fetchMaxAmount(multiProvider, warpCore, params, toast),
  });

  return {
    fetchMaxAmount: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
}

async function fetchMaxAmount(
  multiProvider: MultiProtocolProvider,
  warpCore: WarpCore,
  { accounts, balance, destination, origin }: FetchMaxParams,
  toast: ReturnType<typeof useToast>["toast"],
) {
  // Get account address and public key
  const [accountError, accountSuccess] = trySync(() =>
    getAccountAddressAndPubKey(multiProvider, origin, accounts),
  );

  if (accountError !== undefined) {
    logger.warn("Error getting account address and public key:", accountError);
    toast({
      title: "Error calculating maximum transfer amount",
      description:
        accountError instanceof Error
          ? accountError.message
          : "Unable to retrieve account information",
    });
    return undefined;
  }

  const { address, publicKey } = accountSuccess;

  if (!address) {
    toast.error("Missing wallet address or public key");
    return undefined;
  }

  const [pubKeyError, resolvedPubKey] = await tryAsync(
    publicKey ?? Promise.reject(new Error("Sender public key is not provided")),
  );

  if (pubKeyError !== undefined) {
    logger.warn("Error resolving sender public key:", pubKeyError);
    toast({
      title: "Error calculating maximum transfer amount",
      description:
        pubKeyError instanceof Error
          ? pubKeyError.message
          : "Unable to retrieve account keys",
    });
    return undefined;
  }

  // Get max transfer amount
  const [maxAmountError, maxAmount] = await tryAsync(
    warpCore.getMaxTransferAmount({
      balance,
      destination,
      sender: address,
      senderPubKey: resolvedPubKey,
    }),
  );

  if (maxAmountError !== undefined) {
    logger.warn("Error fetching fee quotes for max amount:", maxAmountError);
    toast({
      title: "Error calculating maximum transfer amount",
      description:
        maxAmountError instanceof Error
          ? maxAmountError.message
          : "Unable to calculate max amount",
    });
    return undefined;
  }

  return maxAmount;
}
