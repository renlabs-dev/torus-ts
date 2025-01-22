"use client";

import {
  Card,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@torus-ts/ui";
import { formatToken } from "@torus-ts/utils/subspace";
import { Info } from "lucide-react";
import { useDelegateAgentStore } from "~/stores/delegateAgentStore";
import { useKeyStakedBy } from "@torus-ts/query-provider/hooks";
import { useMemo } from "react";
import { useTorus } from "@torus-ts/torus-provider";
import { VALIDATOR_ADDRESS } from "./delegated-list";
import type { SS58Address } from "@torus-ts/subspace";

export const SidebarInfo = () => {
  const { selectedAccount, api: torusApi } = useTorus();
  const { data: accountStakedBy, isLoading: isLoadingAccountStakedBy } =
    useKeyStakedBy(torusApi, VALIDATOR_ADDRESS);
  const { delegatedAgents } = useDelegateAgentStore();

  const userWeightPower = useMemo(() => {
    if (isLoadingAccountStakedBy || !selectedAccount?.address) return null;

    if (!accountStakedBy) {
      return BigInt(0);
    }

    const stake = accountStakedBy.get(selectedAccount.address as SS58Address);

    return formatToken(stake ?? 0n);
  }, [accountStakedBy, isLoadingAccountStakedBy, selectedAccount]);

  return (
    <Card className="hidden animate-fade-up flex-col gap-6 px-7 py-5 animate-delay-[400ms] md:flex">
      <div>
        {userWeightPower === null ? (
          <Skeleton className="flex w-3/4 py-3" />
        ) : (
          <span className="flex items-end gap-1.5">
            {userWeightPower}
            <span className="mb-0.5 text-xs">TORUS</span>
          </span>
        )}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <span className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Info size={14} />
                Your Weight Power
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-[200px] space-y-3">
              <p className="">
                Your weight power is the amount of stake you have in the
                Allocator app.
              </p>
              <p>Check the tutorial to learn more about how to stake.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
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
