"use client";

import React, { useMemo } from "react";
import { Lock, Unlock } from "lucide-react";

import { useTorus } from "@torus-ts/providers/use-torus";
import { Card, Skeleton } from "@torus-ts/ui";
import { formatToken } from "@torus-ts/utils/subspace";

export function WalletBalance() {
  const { userTotalStaked, balance } = useTorus();

  const totalStakedBalance = useMemo(() => {
    if (!userTotalStaked) return null;

    const totalStaked = userTotalStaked.reduce((acc, item) => {
      return acc + BigInt(item.stake);
    }, 0n);
    return totalStaked;
  }, [userTotalStaked]);

  const balancesList = [
    {
      amount: balance,
      label: "Free Balance",
      icon: <Lock size={16} />,
    },
    {
      amount: totalStakedBalance,
      label: "Staked Balance",
      icon: <Unlock size={16} />,
    },
  ];

  return (
    <div className="min-fit flex flex-col gap-4">
      {balancesList.map((balance) => (
        <Card
          key={balance.label}
          className="hidden flex-col gap-2 border-muted bg-background px-7 py-5 md:flex"
        >
          {balance.amount && (
            <p className="flex items-end gap-1 text-muted-foreground">
              {formatToken(balance.amount)}
              <span className="mb-0.5 text-xs">TOR</span>
            </p>
          )}
          {!balance.amount && <Skeleton className="flex w-1/2 py-3" />}

          <span className="text-sx flex items-center gap-2">
            {balance.icon} {balance.label}
          </span>
        </Card>
      ))}
    </div>
  );
}
