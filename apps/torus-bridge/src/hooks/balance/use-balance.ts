import type { ChainName, IToken } from "@hyperlane-xyz/sdk";
import type { Address } from "@hyperlane-xyz/utils";
import { isValidAddress } from "@hyperlane-xyz/utils";
import { useQuery } from "@tanstack/react-query";
import { tryAsync } from "@torus-network/torus-utils/try-catch";
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
    queryFn: async () => {
      if (
        !chain ||
        !token ||
        !address ||
        !isValidAddress(address, token.protocol)
      )
        return null;

      const [balanceError, balance] = await tryAsync(
        token.getBalance(multiProvider, address),
      );

      if (balanceError !== undefined) {
        console.error(
          `Error fetching balance for ${address} on ${chain}:`,
          balanceError,
        );
        throw balanceError; // Rethrow to let React Query handle the error state
      }

      return balance;
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
