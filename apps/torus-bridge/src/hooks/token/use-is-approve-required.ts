import type { IToken } from "@hyperlane-xyz/sdk";
import { useAccountAddressForChain } from "@hyperlane-xyz/widgets";
import { useQuery } from "@tanstack/react-query";
import { useToastError } from "~/app/_components/toast/use-toast-error";
import { useMultiProvider } from "~/hooks/use-multi-provider";
import { useWarpCore } from ".";
import { tryAsync, trySync } from "@torus-network/torus-utils/try-catch";

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

      // First try to create the token amount
      const [amountError, tokenAmount] = trySync(() => token.amount(amount));

      if (amountError !== undefined) {
        console.error(
          `Error creating token amount for ${token.symbol}:`,
          amountError,
        );
        throw amountError;
      }

      // Then check if approval is required
      const [approvalError, isRequired] = await tryAsync(
        warpCore.isApproveRequired({
          originTokenAmount: tokenAmount,
          owner,
        }),
      );

      if (approvalError !== undefined) {
        console.error(
          `Error checking approval requirement for ${owner}:`,
          approvalError,
        );
        throw approvalError; // Rethrow to let React Query handle the error state
      }

      return isRequired;
    },
    enabled,
  });

  useToastError(error, "Error fetching approval status");

  return { isLoading, isError, isApproveRequired: !!data };
}
