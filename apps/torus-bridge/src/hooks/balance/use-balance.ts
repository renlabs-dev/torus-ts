import type { ChainName, IToken } from "@hyperlane-xyz/sdk";
import type { Address } from "@hyperlane-xyz/utils";
import { isValidAddress } from "@hyperlane-xyz/utils";
import { useQuery } from "@tanstack/react-query";
import { useToastError } from "~/app/_components/toast/use-toast-error";
import { useMultiProvider } from "~/hooks/use-multi-provider";

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
