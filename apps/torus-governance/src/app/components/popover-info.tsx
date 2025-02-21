"use client";

import { Button } from "@torus-ts/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@torus-ts/ui/components/popover";
import { Skeleton } from "@torus-ts/ui/components/skeleton";
import { useToast } from "@torus-ts/ui/hooks/use-toast";
import { formatToken, smallAddress } from "@torus-ts/utils/subspace";
import { Copy, Ellipsis } from "lucide-react";
import { useGovernance } from "~/context/governance-provider";

export const PopoverInfo = () => {
  const {
    rewardAllocation,
    daoTreasuryBalance,
    daoTreasuryAddress,
    cadreList,
  } = useGovernance();
  const { toast } = useToast();

  const { data: cadreListData, isFetching: isFetchingCadreList } = cadreList;

  function handleCopyClick(value: string): void {
    navigator.clipboard
      .writeText(value)
      .then(() => {
        toast({
          title: "SUCCCESS.",
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
    <Popover>
      <PopoverTrigger asChild className="lg:hidden">
        <Button variant="outline">
          <Ellipsis size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="border-muted bg-background mr-5 flex w-fit flex-col gap-6 px-4 py-4">
        <div>
          {daoTreasuryBalance.data === undefined ? (
            <Skeleton className="flex w-1/3 py-3" />
          ) : (
            <p className="flex items-end gap-1 text-base">
              {formatToken(daoTreasuryBalance.data)}
              <span className="mb-0.5 text-xs">TORUS</span>
            </p>
          )}

          <span className="text-sx text-muted-foreground">
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
        <div>
          <p>
            {isFetchingCadreList ? (
              <Skeleton className="flex w-1/5 py-3" />
            ) : (
              (cadreListData?.length ?? 0)
            )}
          </p>
          <span className="text-muted-foreground text-sm">
            Curator DAO Members
          </span>
        </div>

        <div>
          <p>
            {isFetchingCadreList ? (
              <Skeleton className="flex w-1/5 py-3" />
            ) : (
              Math.floor((cadreListData?.length ?? 0) / 2 + 1) // TODO: move logic out of component
            )}
          </p>
          <span className="text-muted-foreground text-sm">
            Curator DAO Vote threshold
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
};
