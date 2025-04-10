"use client";

import { Button } from "@torus-ts/ui/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@torus-ts/ui/components/popover";
import { Skeleton } from "@torus-ts/ui/components/skeleton";
import { Copy, Ellipsis } from "lucide-react";
import type { SidebarDataProps } from "./sidebar-info";

export const SidebarInfoMobile = ({ data }: { data: SidebarDataProps }) => {
  return (
    <Popover>
      <PopoverTrigger asChild className="lg:hidden">
        <Button variant="outline">
          <Ellipsis size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="border-muted bg-background mr-5 flex w-fit flex-col gap-6 px-4 py-4">
        <div>
          {data.treasuryBalance.isLoading ? (
            <Skeleton className="flex w-1/3 py-3" />
          ) : (
            <p className="flex items-end gap-1 text-base">
              {data.treasuryBalance.value}
              <span className="mb-0.5 text-xs">TORUS</span>
            </p>
          )}

          <span className="text-sx text-muted-foreground">
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
        <div>
          <p>
            {data.cadreMembers.isLoading ? (
              <Skeleton className="flex w-1/5 py-3" />
            ) : (
              data.cadreMembers.value
            )}
          </p>
          <span className="text-muted-foreground text-sm">
            Curator DAO Members
          </span>
        </div>

        <div>
          <p>
            {data.voteThreshold.isLoading ? (
              <Skeleton className="flex w-1/5 py-3" />
            ) : (
              data.voteThreshold.value
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
