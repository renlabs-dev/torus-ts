import type { ChainName, IToken } from "@hyperlane-xyz/sdk";
import type { Address } from "@hyperlane-xyz/utils";
import { isValidAddress } from "@hyperlane-xyz/utils";
import { useAccountAddressForChain } from "@hyperlane-xyz/widgets";
import { useQuery } from "@tanstack/react-query";

import { useMultiProvider } from "~/hooks/use-multi-provider";
import type { TransferFormValues } from "../../utils/types";
import { useTokenByIndex } from "./hooks";
import { useToastError } from "~/app/components/toast/useToastError";

export function useBalance(
  chain?: ChainName,
  token?: IToken,
  address?: Address,
) {
  const multiProvider = useMultiProvider();
  const { isLoading, isError, error, data } = useQuery({
    // The Token and Multiprovider classes are not serializable, so we can't use it as a key
    queryKey: ["useBalance", chain, address, token?.addressOrDenom],
    queryFn: () => {
      if (
        !chain ||
        !token ||
        !address ||
        !isValidAddress(address, token.protocol)
      )
        return null;
      return token.getBalance(multiProvider, address);
    },
    refetchInterval: 5000,
  });

  useToastError(error, "Error fetching balance");

  return {
    isLoading,
    isError,
    balance: data ?? undefined,
  };
}

export function useOriginBalance({ origin, tokenIndex }: TransferFormValues) {
  const multiProvider = useMultiProvider();
  const address = useAccountAddressForChain(multiProvider, origin);
  const token = useTokenByIndex(tokenIndex);
  return useBalance(origin, token, address);
}

export function useDestinationBalance({
  destination,
  tokenIndex,
  recipient,
}: TransferFormValues) {
  const originToken = useTokenByIndex(tokenIndex);
  const connection = originToken?.getConnectionForChain(destination);
  return useBalance(destination, connection?.token, recipient);
}
