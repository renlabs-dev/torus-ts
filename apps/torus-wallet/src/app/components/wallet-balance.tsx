"use client";

import React, { useCallback } from "react";
import { Lock } from "lucide-react";
import { Card, Skeleton } from "@torus-ts/ui";
import { formatToken } from "@torus-ts/utils/subspace";
import { useWallet } from "@torus-ts/wallet-provider";

export function WalletBalance() {
  const { accountFreeBalance, isAccountConnected, isInitialized } = useWallet();

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

  return (
    <div className="min-fit flex flex-col gap-4">
      <Card className="flex w-full flex-col gap-2 px-7 py-5">
        {typeof userAccountFreeBalance() === "bigint" ? (
          <p className="text-muted-fofreground flex items-end gap-1">
            {formatToken(userAccountFreeBalance())}
            <span className="mb-0.5 text-xs">TORUS</span>
          </p>
        ) : (
          <Skeleton className="flex w-1/2 py-3" />
        )}

        <span className="text-sx flex items-center gap-2">
          <Lock size={16} /> Free Balance
        </span>
      </Card>
    </div>
  );
}
