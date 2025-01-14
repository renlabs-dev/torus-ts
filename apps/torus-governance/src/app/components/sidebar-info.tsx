"use client";

import { Copy } from "lucide-react";

import { toast } from "@torus-ts/toast-provider";
import { Card, Skeleton } from "@torus-ts/ui";
import { formatToken, smallAddress } from "@torus-ts/utils/subspace";

import { useGovernance } from "~/context/governance-provider";

export const SidebarInfo = () => {
  const { rewardAllocation, daoTreasuryAddress, daoTreasuryBalance } =
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
    <Card className="hidden animate-fade-up flex-col gap-6 px-7 py-5 animate-delay-[400ms] lg:flex">
      <div>
        {daoTreasuryBalance.data === undefined ? (
          <Skeleton className="flex w-1/3 py-3" />
        ) : (
          <p className="flex items-end gap-1 text-base">
            {formatToken(daoTreasuryBalance.data)}
            <span className="mb-0.5 text-xs">TORUS</span>
          </p>
        )}
        <span className="text-sm text-muted-foreground">
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
        <span className="text-sm text-muted-foreground">
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
        <span className="text-sm text-muted-foreground">
          Next DAO incentives payout
        </span>
      </div>
    </Card>
  );
};
