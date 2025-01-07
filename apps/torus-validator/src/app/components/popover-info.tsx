"use client";

import { Ellipsis } from "lucide-react";

import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Skeleton,
} from "@torus-ts/ui";

import { formatToken } from "@torus-ts/utils/subspace";
import { useDelegateAgentStore } from "~/stores/delegateAgentStore";
import { useKeyStakedBy } from "@torus-ts/query-provider/hooks";
import { useMemo } from "react";
import { useTorus } from "@torus-ts/torus-provider";
import { VALIDATOR_ADDRESS } from "./delegated-list";
import type { SS58Address } from "@torus-ts/subspace";

export const PopoverInfo = () => {
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

    const stake = accountStakedBy.get(selectedAccount.address as SS58Address);

    return formatToken(stake ?? 0n);
  }, [
    accountStakedBy,
    isLoadingAccountStakedBy,
    selectedAccount,
    refetchAccountStakedBy,
  ]);

  return (
    <Popover>
      <PopoverTrigger asChild className="md:hidden">
        <Button variant="outline">
          <Ellipsis size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="mr-5 flex w-fit flex-col gap-6 border-muted bg-background px-4 py-4">
        <div className="flex flex-col gap-1.5">
          {userWeightPower === null ? (
            <Skeleton className="flex w-3/4 py-3" />
          ) : (
            <span className="flex items-end gap-1.5">
              {userWeightPower}
              <span className="mb-0.5 text-xs">TORUS</span>
            </span>
          )}
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            Your Weight Power
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          {userWeightPower === null ? (
            <Skeleton className="flex w-1/4 py-3" />
          ) : (
            <span>{delegatedAgents.length}</span>
          )}
          <span className="text-sm text-muted-foreground">
            Agents Allocated
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
};
