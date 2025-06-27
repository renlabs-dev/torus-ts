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
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { useMultiProvider } from "~/hooks/use-multi-provider";
import { logger } from "../utils/logger";
import { useWarpCore } from "./token";
import { isPromise } from "~/utils/helpers";

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
): Promise<TokenAmount | undefined> {
  const [accountError, { address, publicKey } = {}] = trySync(() =>
    getAccountAddressAndPubKey(multiProvider, origin, accounts),
  );

  if (accountError || !address) {
    logger.warn("Error getting account address or public key:", accountError);
    toast({
      title: "Error calculating maximum transfer amount",
      description:
        accountError instanceof Error
          ? accountError.message
          : "Unable to retrieve account information",
    });
    return undefined;
  }

  const [senderPubKeyErr, senderPubKey] = isPromise(publicKey)
    ? await tryAsync(publicKey)
    : [undefined, publicKey];
  if (senderPubKeyErr) {
    logger.warn("Error getting sender public key:", senderPubKeyErr);
    toast({
      title: "Error calculating maximum transfer amount",
      description: "Unable to retrieve sender public key",
    });
    return undefined;
  }

  const [maxAmountError, maxAmount] = await tryAsync(
    warpCore.getMaxTransferAmount({
      balance,
      destination,
      sender: address,
      senderPubKey,
    }),
  );

  if (maxAmountError) {
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
