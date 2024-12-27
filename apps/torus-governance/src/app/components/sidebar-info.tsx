"use client";

import { Suspense } from "react";
import { Copy } from "lucide-react";

import { toast } from "@torus-ts/toast-provider";
import { Card, Separator, Skeleton } from "@torus-ts/ui";
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
    <Card className="hidden flex-col gap-6 border-muted bg-background px-7 py-5 md:flex">
      <div>
        {daoTreasuryBalance.data === undefined ? (
          <Skeleton className="flex w-1/3 py-3" />
        ) : (
          <p className="flex items-end gap-1 text-base">
            {formatToken(daoTreasuryBalance.data)}
            <span className="mb-0.5 text-xs">TOR</span>
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
            <span className="mb-0.5 text-xs">TOR</span>
          </p>
        )}
        <span className="text-sm text-muted-foreground">
          Next DAO incentives payout
        </span>
      </div>
    </Card>
  );
};

function SidebarSkeleton() {
  return (
    <div className="flex max-h-fit min-w-fit flex-col rounded-md border border-muted bg-background">
      <div className="flex flex-col gap-1.5 p-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
      <Separator className="w-full" />
      <div className="flex flex-col gap-6 p-8 py-6">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-6 w-3/4" />
      </div>
      <Separator className="w-full" />
      <div className="flex flex-col p-8 py-6">
        <Skeleton className="h-6 w-1/2" />
      </div>
    </div>
  );
}

export const SidebarInfoContent = () => {
  return (
    <Suspense fallback={<SidebarSkeleton />}>
      <SidebarInfo />
    </Suspense>
  );
};
