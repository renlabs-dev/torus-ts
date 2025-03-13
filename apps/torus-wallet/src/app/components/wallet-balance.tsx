"use client";

import { RewardIntervalProgress } from "./reward-interval-progress";
import { Card } from "@torus-ts/ui/components/card";
import { Skeleton } from "@torus-ts/ui/components/skeleton";
import { formatToken } from "@torus-ts/utils/subspace";
import { Lock, Scale, Unlock } from "lucide-react";
import { useMemo } from "react";
import { useWallet } from "~/context/wallet-provider";

const BALANCE_ICONS = {
  free: <Lock size={16} />,
  staked: <Unlock size={16} />,
  total: <Scale size={16} />,
};

export function WalletBalance() {
  const { accountFreeBalance, accountStakedBalance } = useWallet();

  const getBalance = useMemo(() => {
    const free = accountFreeBalance.data ?? 0n;
    const staked = accountStakedBalance ?? 0n;
    const total = free + staked;

    return {
      free,
      staked,
      total,
    };
  }, [accountFreeBalance.data, accountStakedBalance]);

  const balances = [
    {
      label: "Free Balance",
      amount: getBalance.free,
      icon: BALANCE_ICONS.free,
    },
    {
      label: "Staked Balance",
      amount: getBalance.staked,
      icon: BALANCE_ICONS.staked,
    },
    ...(getBalance.total > 0n
      ? [
          {
            label: "Total Balance",
            amount: getBalance.total,
            icon: BALANCE_ICONS.total,
          },
        ]
      : []),
  ];

  const isLoading = accountFreeBalance.isLoading;

  return (
    <div className="xs:flex-row flex min-h-fit flex-col gap-4 lg:flex-col">
      {balances.map(({ amount, icon, label }) => (
        <Card key={label} className="flex w-full flex-col gap-2 px-7 py-5">
          {!isLoading ? (
            <p className="text-muted-foreground flex items-end gap-1">
              {formatToken(amount)}
              <span className="mb-0.5 text-xs">TORUS</span>
            </p>
          ) : (
            <Skeleton className="w-1/2 py-3" />
          )}
          <span className="flex items-center gap-2 text-sm">
            {icon} {label}
          </span>
        </Card>
      ))}
      <RewardIntervalProgress />
    </div>
  );
}
