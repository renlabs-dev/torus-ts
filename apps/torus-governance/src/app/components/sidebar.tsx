"use client"

import { useBalance } from "@torus-ts/providers/hooks";
import { toast } from "@torus-ts/providers/use-toast";
import { useTorus } from "@torus-ts/providers/use-torus";
import { Button, Separator, Skeleton } from "@torus-ts/ui";
import { formatToken, smallAddress } from "@torus-ts/utils";
import { Check, Copy } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useMemo } from "react";

const navSidebarOptions = [
  {
    title: "Proposals",
    href: "proposals",
  },
  {
    title: "DAO Applications",
    href: "daos-applications",
  },
  {
    title: "Community Concepts",
    href: "community-concepts",
  },
  {
    title: "DAO Members Dashboard",
    href: "dao-members-dashboard",
  },
] as const;

export const Sidebar = () => {
  const { rewardAllocation, daoTreasury, api } = useTorus()
  const { data: daosTreasuries } = useBalance(api, daoTreasury);

  const searchParams = useSearchParams();
  const router = useRouter();

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

  const viewMode = useMemo(() => searchParams.get('view') ?? '', [searchParams]);

  const updateView = useCallback((newView: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', newView);
    router.push(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  const handleViewChange = useCallback((value: string) => {
    if (value !== viewMode && navSidebarOptions.find((view) => view.href === value)) {
      updateView(value);
    }
  }, [viewMode, updateView]);

  useEffect(() => {
    if (!navSidebarOptions.find((view) => view.href === viewMode)) {
      updateView('proposals');
    }
  }, [viewMode, updateView]);

  return (
    <div className="flex flex-col border rounded-lg bg-background border-muted max-h-fit min-w-fit">
      <div className="flex flex-col gap-1.5 p-6 ">
        {navSidebarOptions.map((view) => (
          <Button onClick={() => handleViewChange(view.href)} key={view.href} variant="ghost" className={`text-lg p-2 border-none rounded-md w-full gap-4 justify-between`}>
            {view.title}
            <Check size={16} className={`${viewMode === view.href ? "opacity-100" : "opacity-0"} transition`} />
          </Button>
        ))}
      </div>

      <Separator className="w-full" />

      <div className="flex flex-col gap-6 p-8 py-6">
        <div>

          {daosTreasuries && (
            <p className="flex items-end gap-1 text-base">
              {formatToken(daosTreasuries)}
              <span className="text-xs mb-0.5">TOR</span>
            </p>
          )}
          {!daosTreasuries && <Skeleton className="flex w-1/2 py-3" />}

          <span className="text-sx text-muted-foreground">DAO treasury funds</span>
        </div>
        <div>
          {!daoTreasury && <Skeleton className="flex w-1/2 py-3" />}
          {daoTreasury && (
            <span className="flex gap-3">{smallAddress(daoTreasury)}
              <button onClick={() => handleCopyClick(daoTreasury)}>
                <Copy size={16} className="hover:text-white text-muted-foreground" />
              </button>
            </span>
          )}
          <span className="text-sm text-muted-foreground">DAO treasury address</span>
        </div>
      </div>

      <Separator className="w-full" />

      <div className="flex flex-col p-8 py-6">
        {!rewardAllocation && <Skeleton className="flex w-1/2 py-3" />}
        {rewardAllocation &&
          <p className="flex items-end gap-1 text-base">
            {formatToken(Number(rewardAllocation))}
            <span className="text-xs mb-0.5">TOR</span>
          </p>
        }
        <span className="text-sm text-muted-foreground">Next DAO incentives payout</span>
      </div>
    </div>
  )
}