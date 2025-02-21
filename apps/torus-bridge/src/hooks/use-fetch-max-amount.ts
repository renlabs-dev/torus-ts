import { logger } from "../utils/logger";
import { useWarpCore } from "./token";
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
  try {
    const { address, publicKey } = getAccountAddressAndPubKey(
      multiProvider,
      origin,
      accounts,
    );
    if (!address) return balance;
    const maxAmount = await warpCore.getMaxTransferAmount({
      balance,
      destination,
      sender: address,
      senderPubKey: await publicKey,
    });
    return maxAmount;
  } catch (error) {
    logger.warn("Error fetching fee quotes for max amount", error);
    toast({
      title: "Error calculating maximum transfer amount",
      description:
        error instanceof Error
          ? error.message
          : "Unable to calculate max amount",
    });
    return undefined;
  }
}
