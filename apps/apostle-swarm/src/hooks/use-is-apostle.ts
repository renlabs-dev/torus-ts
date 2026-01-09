import { useTorus } from "@torus-ts/torus-provider";
import { api } from "~/trpc/react";

/**
 * Hook to check if the connected user is an apostle.
 * Returns apostle status, admin status, and the full apostle record if found.
 */
export function useIsApostle() {
  const { selectedAccount, isAccountConnected } = useTorus();

  const query = api.apostleSwarm.checkIsApostle.useQuery(
    { walletAddress: selectedAccount?.address ?? "" },
    {
      enabled: isAccountConnected && selectedAccount?.address !== undefined,
      retry: false,
    },
  );

  return {
    isApostle: query.data?.isApostle ?? false,
    isAdmin: query.data?.isAdmin ?? false,
    apostle: query.data?.apostle ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
