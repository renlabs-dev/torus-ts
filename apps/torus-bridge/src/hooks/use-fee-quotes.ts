import type { ChainName, TokenAmount, WarpCore } from "@hyperlane-xyz/sdk";
import type { Address, HexString } from "@hyperlane-xyz/utils";
import {
  getAccountAddressAndPubKey,
  useAccounts,
} from "@hyperlane-xyz/widgets";
import { useQuery } from "@tanstack/react-query";
import { logger } from "../utils/logger";
import type { TransferFormValues } from "../utils/types";
import { getTokenByIndex, useWarpCore } from "./token";
import { useMultiProvider } from "./use-multi-provider";

const FEE_QUOTE_REFRESH_INTERVAL = 15_000; // 10s

export function useFeeQuotes(
  { origin, destination, tokenIndex }: TransferFormValues,
  enabled: boolean,
) {
  const multiProvider = useMultiProvider();
  const warpCore = useWarpCore();

  const { accounts } = useAccounts(multiProvider);
  const { address: sender, publicKey: senderPubKey } =
    getAccountAddressAndPubKey(multiProvider, origin, accounts);

  const { isLoading, isError, data } = useQuery({
    // The WarpCore class is not serializable, so we can't use it as a key

    queryKey: ["useFeeQuotes", destination, tokenIndex, sender, senderPubKey],
    queryFn: () =>
      fetchFeeQuotes(warpCore, destination, tokenIndex, sender, senderPubKey),
    enabled,
    refetchInterval: FEE_QUOTE_REFRESH_INTERVAL,
  });

  return { isLoading, isError, fees: data };
}

async function fetchFeeQuotes(
  warpCore: WarpCore,
  destination?: ChainName,
  tokenIndex?: number,
  sender?: Address,
  senderPubKey?: Promise<HexString>,
): Promise<{ interchainQuote: TokenAmount; localQuote: TokenAmount } | null> {
  const originToken = getTokenByIndex(warpCore, tokenIndex);
  if (!destination || !sender || !originToken) return null;
  logger.debug("Fetching fee quotes");
  return warpCore.estimateTransferRemoteFees({
    originToken,
    destination,
    sender,
    senderPubKey: await senderPubKey,
  });
}
