"use client";

import React, { useEffect } from "react";
import { Lock, Unlock } from "lucide-react";

import { Card, Skeleton } from "@torus-ts/ui";
import { formatToken } from "@torus-ts/utils/subspace";

import { useWallet } from "~/context/wallet-provider";

export function WalletBalance() {
  const { accountFreeBalance, accountStakedBalance, stakeOut } = useWallet();

  const balancesList = [
    {
      amount: accountFreeBalance.data,
      label: "Free Balance",
      icon: <Lock size={16} />,
    },
    {
      amount: accountStakedBalance,
      label: "Staked Balance",
      icon: <Unlock size={16} />,
    },
  ];

  useEffect(() => {
    console.log("balance", accountFreeBalance.data);
    console.log("totalStakedBalance", accountStakedBalance);
    console.log("stakeout", stakeOut);
  }, [stakeOut, accountFreeBalance.data, accountStakedBalance]);

  return (
    <div className="min-fit flex flex-col gap-4 xs:flex-row lg:flex-col">
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
