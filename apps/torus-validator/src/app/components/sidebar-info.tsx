"use client";

import { Card, Skeleton } from "@torus-ts/ui";
import { formatToken } from "@torus-ts/utils/subspace";
import { Info } from "lucide-react";
import { useDelegateAgentStore } from "~/stores/delegateAgentStore";
import { useKeyStakedBy } from "@torus-ts/query-provider/hooks";
import { useMemo } from "react";
import { useTorus } from "@torus-ts/torus-provider";
import { VALIDATOR_ADDRESS } from "./delegated-list";

export const SidebarInfo = () => {
  const { selectedAccount, api: torusApi } = useTorus();
  const {
    data: accountStakedBy,
    isLoading: isLoadingAccountStakedBy,
    refetch: refetchAccountStakedBy,
  } = useKeyStakedBy(torusApi, VALIDATOR_ADDRESS);
  const { delegatedAgents } = useDelegateAgentStore();

  const userWeightPower = useMemo(() => {
    if (isLoadingAccountStakedBy || !selectedAccount?.address) return null;

    void refetchAccountStakedBy();
    if (!accountStakedBy) {
      return BigInt(0);
    }

    const data = accountStakedBy.find((stake) =>
      selectedAccount.address.includes(stake.address),
    );

    return formatToken(Number(data?.stake ?? 0n));
  }, [
    accountStakedBy,
    isLoadingAccountStakedBy,
    selectedAccount,
    refetchAccountStakedBy,
  ]);

  return (
    <Card className="hidden animate-fade-up flex-col gap-6 border-muted bg-background px-7 py-5 animate-delay-[400ms] md:flex">
      <div>
        {userWeightPower === null ? (
          <Skeleton className="flex w-3/4 py-3" />
        ) : (
          <span className="flex items-end gap-1.5">
            {userWeightPower}
            <span className="mb-0.5 text-xs">TOR</span>
          </span>
        )}
        <span className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Info size={14} />
          Your Weight Power
        </span>
      </div>
      <div>
        {userWeightPower === null ? (
          <Skeleton className="flex w-1/4 py-3" />
        ) : (
          <span className="flex items-end gap-1.5">
            {delegatedAgents.length}
          </span>
        )}
        <span className="mt-2 text-sm text-muted-foreground">
          Agents Allocated
        </span>
      </div>
    </Card>
  );
};
