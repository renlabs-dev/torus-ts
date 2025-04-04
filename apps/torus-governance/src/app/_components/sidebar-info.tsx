"use client";

import { Card } from "@torus-ts/ui/components/card";
import { Skeleton } from "@torus-ts/ui/components/skeleton";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { formatToken, smallAddress } from "@torus-ts/utils/subspace";
import { useGovernance } from "~/context/governance-provider";
import { api } from "~/trpc/react";
import { Copy } from "lucide-react";

export const SidebarInfo = () => {
  const { rewardAllocation, daoTreasuryAddress, daoTreasuryBalance } =
    useGovernance();
  const { toast } = useToast();

  const { data: cadreListData, isLoading: isFetchingCadreList } =
    api.cadre.all.useQuery();

  function handleCopyClick(value: string): void {
    navigator.clipboard
      .writeText(value)
      .then(() => {
        toast({
          title: "Copied!",
          description: "Treasury address copied to clipboard.",
        });
      })
      .catch(() => {
        toast({
          title: "Uh oh! Something went wrong.",
          description: "Failed to copy treasury address.",
        });
      });
  }

  return (
    <Card className="animate-fade-up animate-delay-[400ms] hidden flex-col gap-6 px-7 py-5 lg:flex">
      <div>
        {daoTreasuryBalance.data === undefined ? (
          <Skeleton className="flex w-1/3 py-3" />
        ) : (
          <p className="flex items-end gap-1 text-base">
            {formatToken(daoTreasuryBalance.data)}
            <span className="mb-0.5 text-xs">TORUS</span>
          </p>
        )}
        <span className="text-muted-foreground text-sm">
          DAO treasury funds
        </span>
      </div>
      <div>
        {daoTreasuryAddress.data === undefined ? (
          <Skeleton className="flex w-3/4 py-3" />
        ) : (
          <span className="flex gap-3">
            {smallAddress(daoTreasuryAddress.data)}
            <button onClick={() => handleCopyClick(daoTreasuryAddress.data)}>
              <Copy
                size={16}
                className="text-muted-foreground hover:text-white"
              />
            </button>
          </span>
        )}
        <span className="text-muted-foreground text-sm">
          DAO treasury address
        </span>
      </div>
      <div className="flex flex-col">
        {rewardAllocation.data === undefined ? (
          <Skeleton className="flex w-1/3 py-3" />
        ) : (
          <p className="flex items-end gap-1 text-base">
            {formatToken(rewardAllocation.data)}
            <span className="mb-0.5 text-xs">TORUS</span>
          </p>
        )}
        <span className="text-muted-foreground text-sm">
          Next DAO incentives payout
        </span>
      </div>
      <div className="flex flex-col">
        <span>
          {isFetchingCadreList ? (
            <Skeleton className="flex w-1/5 py-3" />
          ) : (
            (cadreListData?.length ?? 0)
          )}
        </span>
        <span className="text-muted-foreground text-sm">
          Curator DAO Members
        </span>
      </div>

      <div className="flex flex-col">
        <span>
          {isFetchingCadreList ? (
            <Skeleton className="flex w-1/5 py-3" />
          ) : (
            Math.floor((cadreListData?.length ?? 0) / 2 + 1) // TODO: move logic out of component
          )}
        </span>
        <span className="text-muted-foreground text-sm">
          {" "}
          Curator DAO Vote threshold
        </span>
      </div>
    </Card>
  );
};
