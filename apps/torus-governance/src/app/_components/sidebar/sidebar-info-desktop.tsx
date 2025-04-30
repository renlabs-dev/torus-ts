"use client";

import { Card } from "@torus-ts/ui/components/card";
import { Skeleton } from "@torus-ts/ui/components/skeleton";
import { Copy } from "lucide-react";
import type { SidebarDataProps } from "./sidebar-info";

export const SidebarInfoDesktop = ({ data }: { data: SidebarDataProps }) => {
  return (
    <>
      <Card className="animate-fade-up animate-delay-[400ms] hidden flex-col gap-7 p-7 lg:flex">
        <div>
          {data.treasuryBalance.isLoading ? (
            <Skeleton className="flex w-1/3 py-3" />
          ) : (
            <p className="flex items-end gap-1 text-base">
              {data.treasuryBalance.value}
              <span className="mb-0.5 text-xs">TORUS</span>
            </p>
          )}
          <span className="text-muted-foreground text-sm">
            DAO treasury funds
          </span>
        </div>
        <div>
          {data.treasuryAddress.isLoading ? (
            <Skeleton className="flex w-3/4 py-3" />
          ) : (
            <span className="flex gap-3">
              {data.treasuryAddress.formattedValue}
              <button
                onClick={() => data.handleCopyClick(data.treasuryAddress.value)}
              >
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
          {data.incentivesPayout.isLoading ? (
            <Skeleton className="flex w-1/3 py-3" />
          ) : (
            <p className="flex items-end gap-1 text-base">
              {data.incentivesPayout.value}
              <span className="mb-0.5 text-xs">TORUS</span>
            </p>
          )}
          <span className="text-muted-foreground text-sm">
            Next DAO incentives payout
          </span>
        </div>
      </Card>
      <Card className="animate-fade-up animate-delay-[400ms] hidden flex-col gap-6 px-7 py-5 lg:flex">
        <div className="flex flex-col">
          <span>
            {data.cadreMembers.isLoading ? (
              <Skeleton className="flex w-1/5 py-3" />
            ) : (
              data.cadreMembers.value
            )}
          </span>
          <span className="text-muted-foreground text-sm">
            Curator DAO Members
          </span>
        </div>

        <div className="flex flex-col">
          <span>
            {data.voteThreshold.isLoading ? (
              <Skeleton className="flex w-1/5 py-3" />
            ) : (
              data.voteThreshold.value
            )}
          </span>
          <span className="text-muted-foreground text-sm">
            Curator DAO Vote threshold
          </span>
        </div>
      </Card>
    </>
  );
};
