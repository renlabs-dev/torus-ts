"use client";

import { useKeyStakedBy } from "@torus-ts/query-provider/hooks";
import type { SS58Address } from "@torus-ts/subspace";
import { useTorus } from "@torus-ts/torus-provider";
import {
  Card,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@torus-ts/ui";
import { formatToken } from "@torus-ts/utils/subspace";
import { Info } from "lucide-react";
import { useMemo } from "react";
import { ALLOCATOR_ADDRESS } from "~/consts";
import { useDelegateAgentStore } from "~/stores/delegateAgentStore";
import { useTutorialStore } from "~/stores/tutorialStore";

export const UserWeightInfo = () => {
  const { selectedAccount, api: torusApi } = useTorus();
  const { data: accountStakedBy, isLoading: isLoadingAccountStakedBy } =
    useKeyStakedBy(torusApi, ALLOCATOR_ADDRESS);
  const { delegatedAgents } = useDelegateAgentStore();
  const { openTutorial } = useTutorialStore();

  const userWeightPower = useMemo(() => {
    if (isLoadingAccountStakedBy || !selectedAccount?.address) return null;

    if (!accountStakedBy) {
      return BigInt(0);
    }

    const stake = accountStakedBy.get(selectedAccount.address as SS58Address);

    return formatToken(stake ?? 0n);
  }, [accountStakedBy, isLoadingAccountStakedBy, selectedAccount]);

  return (
    <Card className="hidden w-fit flex-row gap-4 px-3 py-2 md:flex">
      <div className="flex items-center gap-2 text-sm">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <span className="flex items-center gap-1.5 text-nowrap text-sm text-muted-foreground">
                <Info size={16} />
                Weight Power:
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-[200px] space-y-3">
              <p className="">
                Your weight power is the amount of stake you have in the
                Allocator app.
              </p>
              <span>
                Check the{" "}
                <button onClick={openTutorial} className="underline">
                  tutorial
                </button>{" "}
                to learn more about how to stake.
              </span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        {userWeightPower === null ? (
          <div className="flex items-center">
            <span className="animate-pulse text-gray-400">00.00</span>
            <span className="ml-0.5 text-xs">TORUS</span>
          </div>
        ) : (
          <span>
            {userWeightPower}
            <span className="ml-0.5 text-xs">TORUS</span>
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-nowrap text-muted-foreground">
          Selected Agents:
        </span>
        {userWeightPower === null ? (
          <span className="animate-pulse text-gray-400">0</span>
        ) : (
          <span>{delegatedAgents.length}</span>
        )}
      </div>
    </Card>
  );
};
