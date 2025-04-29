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
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";

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
  // Get token by index
  const [tokenError, originToken] = trySync(() =>
    getTokenByIndex(warpCore, tokenIndex),
  );

  if (tokenError !== undefined) {
    logger.error(`Error getting token with index ${tokenIndex}:`, tokenError);
    return null;
  }

  // Validate required parameters
  if (!destination || !sender || !originToken || !senderPubKey) {
    return null;
  }

  logger.debug("Fetching fee quotes");

  // Get sender public key
  const [pubKeyError, resolvedPubKey] = await tryAsync(senderPubKey);

  if (pubKeyError !== undefined) {
    logger.error("Error resolving sender public key:", pubKeyError);
    return null;
  }

  // Estimate transfer fees
  const [feeError, feeQuotes] = await tryAsync(
    warpCore.estimateTransferRemoteFees({
      originToken,
      destination,
      sender,
      senderPubKey: resolvedPubKey,
    }),
  );

  if (feeError !== undefined) {
    logger.error(`Error estimating transfer fees to ${destination}:`, feeError);
    return null;
  }

  return feeQuotes;
}
