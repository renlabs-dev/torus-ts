"use client";

import { Copy, Ellipsis } from "lucide-react";

import { toast } from "@torus-ts/providers/use-toast";
import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Skeleton,
} from "@torus-ts/ui";
import { formatToken, smallAddress } from "@torus-ts/utils/subspace";

import { useGovernance } from "~/context/governance-provider";

export const PopoverInfo = () => {
  const { rewardAllocation, daoTreasuryBalance, daoTreasuryAddress } =
    useGovernance();

  function handleCopyClick(value: string): void {
    navigator.clipboard
      .writeText(value)
      .then(() => {
        toast.success("Treasury address copied to clipboard");
      })
      .catch(() => {
        toast.error("Failed to copy treasury address");
      });
  }

  return (
    <Popover>
      <PopoverTrigger asChild className="md:hidden">
        <Button variant="outline">
          <Ellipsis size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="mr-5 flex w-fit flex-col gap-6 border-muted bg-background px-4 py-4">
        <div>
          {daoTreasuryBalance.data !== undefined && (
            <p className="flex items-end gap-1 text-base">
              {formatToken(daoTreasuryBalance.data)}
              <span className="mb-0.5 text-xs">TOR</span>
            </p>
          )}
          {!daoTreasuryBalance.data && <Skeleton className="flex w-1/2 py-3" />}

          <span className="text-sx text-muted-foreground">
            DAO treasury funds
          </span>
        </div>
        <div>
          {!daoTreasuryBalance.data && <Skeleton className="flex w-1/2 py-3" />}
          {daoTreasuryBalance.data && (
            <span className="flex gap-3">
              {smallAddress(daoTreasuryAddress.data as string)}
              <button
                onClick={() =>
                  handleCopyClick(formatToken(daoTreasuryBalance.data))
                }
              >
                <Copy
                  size={16}
                  className="text-muted-foreground hover:text-white"
                />
              </button>
            </span>
          )}
          <span className="text-sm text-muted-foreground">
            DAO treasury address
          </span>
        </div>
        <div className="flex flex-col">
          {!rewardAllocation.data && <Skeleton className="flex w-1/2 py-3" />}
          {rewardAllocation.data !== undefined && (
            <p className="flex items-end gap-1 text-base">
              {formatToken(rewardAllocation.data)}
              <span className="mb-0.5 text-xs">TOR</span>
            </p>
          )}
          <span className="text-sm text-muted-foreground">
            Next DAO incentives payout
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
};
