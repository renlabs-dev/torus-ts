"use client";

import React, { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Copy } from "lucide-react";

import { useBalance } from "@torus-ts/providers/hooks";
import { toast } from "@torus-ts/providers/use-toast";
import { useTorus } from "@torus-ts/providers/use-torus";
import { Button, Card, Separator, Skeleton } from "@torus-ts/ui";
import { formatToken, smallAddress } from "@torus-ts/utils";
import Link from "next/link";

const navSidebarOptions = [
  { title: "Proposals", href: "proposals" },
  { title: "DAO Applications", href: "daos-applications" },
  { title: "Community Concepts", href: "community-concepts" },
  { title: "DAO Members Dashboard", href: "dao-members-dashboard" },
] as const;

function SidebarContent() {
  const { rewardAllocation, daoTreasury, api } = useTorus();
  const { data: daosTreasuries } = useBalance(api, daoTreasury);

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

  const searchParams = useSearchParams();
  const router = useRouter();

  const defaultView = navSidebarOptions[0].href;
  const viewMode = searchParams.get('view');

  useEffect(() => {
    if (!viewMode || !navSidebarOptions.find((view) => view.href === viewMode)) {
      router.push(`?view=${defaultView}`, { scroll: false });
    }
  }, [defaultView, router, searchParams, viewMode]);

  return (
    <div className="flex flex-col gap-6 max-h-fit min-w-fit">
      <Card className="flex flex-col gap-1.5 p-5">
        {navSidebarOptions.map((view) => (
          <Link href={`?view=${view.href}`} key={view.href} prefetch>
            <Button
              variant="ghost"
              className={`w-full justify-between gap-4 border-none px-3 text-base ${viewMode === view.href ? "bg-accent" : ""}`}
            >
              {view.title}
              <Check
                size={16}
                className={`${viewMode === view.href ? "opacity-100" : "opacity-0"} transition`}
              />
            </Button>
          </Link>

        ))}
      </Card>

      <Card className="flex flex-col gap-6 px-7 py-5 border-muted bg-background">
        <div>
          {daosTreasuries && (
            <p className="flex items-end gap-1 text-base">
              {formatToken(daosTreasuries)}
              <span className="mb-0.5 text-xs">TOR</span>
            </p>
          )}
          {!daosTreasuries && <Skeleton className="flex w-1/2 py-3" />}

          <span className="text-sx text-muted-foreground">
            DAO treasury funds
          </span>
        </div>
        <div>
          {!daoTreasury && <Skeleton className="flex w-1/2 py-3" />}
          {daoTreasury && (
            <span className="flex gap-3">
              {smallAddress(daoTreasury)}
              <button onClick={() => handleCopyClick(daoTreasury)}>
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
          {!rewardAllocation && <Skeleton className="flex w-1/2 py-3" />}
          {rewardAllocation && (
            <p className="flex items-end gap-1 text-base">
              {formatToken(Number(rewardAllocation))}
              <span className="mb-0.5 text-xs">TOR</span>
            </p>
          )}
          <span className="text-sm text-muted-foreground">
            Next DAO incentives payout
          </span>
        </div>
      </Card>
    </div>
  );
}

export const Sidebar = () => {
  return (
    <Suspense fallback={<SidebarSkeleton />}>
      <SidebarContent />
    </Suspense>
  );
};

function SidebarSkeleton() {
  return (
    <div className="flex flex-col border rounded-md max-h-fit min-w-fit border-muted bg-background">
      <div className="flex flex-col gap-1.5 p-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="w-full h-10" />
        ))}
      </div>
      <Separator className="w-full" />
      <div className="flex flex-col gap-6 p-8 py-6">
        <Skeleton className="w-1/2 h-6" />
        <Skeleton className="w-3/4 h-6" />
      </div>
      <Separator className="w-full" />
      <div className="flex flex-col p-8 py-6">
        <Skeleton className="w-1/2 h-6" />
      </div>
    </div>
  );
}
