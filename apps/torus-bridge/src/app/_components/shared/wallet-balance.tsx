"use client";

import React, { useCallback } from "react";
import { Lock } from "lucide-react";

import { Card, Skeleton } from "@torus-ts/ui";
import { formatToken } from "@torus-ts/utils/subspace";

import { useTorus } from "@torus-ts/torus-provider";
import { useFreeBalance } from "@torus-ts/query-provider/hooks";
import type { SS58Address } from "@torus-ts/subspace";

export function WalletBalance() {
  const { api, isAccountConnected, isInitialized, selectedAccount } =
    useTorus();

  const accountFreeBalance = useFreeBalance(
    api,
    selectedAccount?.address as SS58Address,
  );

  const userAccountFreeBalance = useCallback(() => {
    if (
      !isInitialized ||
      !isAccountConnected ||
      accountFreeBalance.isRefetching
    )
      return null;

    if (accountFreeBalance.data != null) {
      return accountFreeBalance.data;
    }

    return 0n;
  }, [accountFreeBalance, isAccountConnected, isInitialized]);

  const balancesList = [
    {
      amount: userAccountFreeBalance(),
      label: "Free Balance",
      icon: <Lock size={16} />,
    },
  ];

  return (
    <div className="min-fit flex flex-col gap-4 xs:flex-row lg:flex-col">
      {balancesList.map((balance) => (
        <Card
          key={balance.label}
          className="flex w-full flex-col gap-2 border-muted bg-background px-7 py-5"
        >
          {typeof balance.amount === "bigint" && (
            <p className="text-muted-fofreground flex items-end gap-1">
              {formatToken(balance.amount)}
              <span className="mb-0.5 text-xs">TORUS</span>
            </p>
          )}
          {typeof balance.amount !== "bigint" && (
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
