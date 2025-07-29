import { useMemo } from "react";

import { checkSS58 } from "@torus-network/sdk/types";
import { formatToken } from "@torus-network/torus-utils/torus/token";

import { useKeyStakedBy } from "@torus-ts/query-provider/hooks";
import { useTorus } from "@torus-ts/torus-provider";

import { env } from "~/env";

export function useUserWeightPower() {
  const { selectedAccount, api: torusApi } = useTorus();
  const { data: accountStakedBy, isLoading: isLoadingAccountStakedBy } =
    useKeyStakedBy(torusApi, env("NEXT_PUBLIC_TORUS_ALLOCATOR_ADDRESS"));

  const userWeightPower = useMemo(() => {
    if (isLoadingAccountStakedBy || !selectedAccount?.address) return null;

    if (!accountStakedBy) {
      return BigInt(0);
    }

    const stake = accountStakedBy.get(checkSS58(selectedAccount.address));

    return formatToken(stake ?? 0n);
  }, [accountStakedBy, isLoadingAccountStakedBy, selectedAccount]);

  return {
    userWeightPower,
    isLoading: isLoadingAccountStakedBy,
  };
}
