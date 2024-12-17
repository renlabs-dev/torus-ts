"use client";

import React, { useEffect, useMemo } from "react";
import { Lock, Unlock } from "lucide-react";

import { useTorus } from "@torus-ts/providers/use-torus";
import { Card, Skeleton } from "@torus-ts/ui";
import { formatToken } from "@torus-ts/utils/subspace";

export function WalletBalance() {
  const { balance, selectedAccount, stakeOut } = useTorus();

  const totalStakedBalance = useMemo(() => {
    if (!stakeOut || !selectedAccount) return null;

    const totalStaked = stakeOut.perAddr[selectedAccount.address] ?? 0n;
    return totalStaked;
  }, [selectedAccount, stakeOut]);

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

  useEffect(() => {
    console.log("balance", balance);
    console.log("totalStakedBalance", totalStakedBalance);
    console.log("stakeout", stakeOut);
  }, [balance, totalStakedBalance, stakeOut]);

  return (
    <div className="min-fit lg:flex-col flex flex-col gap-4 xs:flex-row">
      {balancesList.map((balance) => (
        <Card
          key={balance.label}
          className="flex w-full flex-col gap-2 border-muted bg-background px-7 py-5"
        >
          {balance.amount && (
            <p className="text-muted-fofreground flex items-end gap-1">
              {formatToken(balance.amount)}
              <span className="mb-0.5 text-xs">TOR</span>
            </p>
          )}
          {!balance.amount && typeof balance.amount !== "bigint" && (
            <Skeleton className="flex w-1/2 py-3" />
          )}

          <span className="text-sx flex items-center gap-2">
            {balance.icon} {balance.label}
          </span>
        </Card>
      ))}
    </div>
  );
}
