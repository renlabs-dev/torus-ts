import type { IToken } from "@hyperlane-xyz/sdk";
import { useAccountAddressForChain } from "@hyperlane-xyz/widgets";
import { useQuery } from "@tanstack/react-query";
import { useToastError } from "~/app/_components/toast/use-toast-error";
import { useMultiProvider } from "~/hooks/use-multi-provider";
import { useWarpCore } from ".";

export function useIsApproveRequired(
  token?: IToken,
  amount?: string,
  enabled = true,
) {
  const multiProvider = useMultiProvider();
  const warpCore = useWarpCore();

  const owner = useAccountAddressForChain(multiProvider, token?.chainName);

  const { isLoading, isError, error, data } = useQuery({
    // The Token class is not serializable, so we can't use it as a key

    queryKey: ["useIsApproveRequired", owner, amount, token?.addressOrDenom],
    queryFn: async () => {
      if (!token || !owner || !amount) return false;
      return warpCore.isApproveRequired({
        originTokenAmount: token.amount(amount),
        owner,
      });
    },
    enabled,
  });

  useToastError(error, "Error fetching approval status");

  return { isLoading, isError, isApproveRequired: !!data };
}
