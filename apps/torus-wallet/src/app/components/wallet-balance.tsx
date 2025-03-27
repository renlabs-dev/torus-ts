"use client";

import { RewardIntervalProgress } from "./reward-interval-progress";
import { Card } from "@torus-ts/ui/components/card";
import { CopyButton } from "@torus-ts/ui/components/copy-button";
import { Skeleton } from "@torus-ts/ui/components/skeleton";
import { formatToken, smallAddress } from "@torus-ts/utils/subspace";
import { Lock, Scale, Unlock, Copy } from "lucide-react";
import Image from "next/image";
import { useMemo, useId } from "react";
import { useWallet } from "~/context/wallet-provider";

const BALANCE_ICONS = {
  free: <Lock size={16} />,
  staked: <Unlock size={16} />,
  total: <Scale size={16} />,
};

export function WalletBalance() {
  const { accountFreeBalance, accountStakedBalance, selectedAccount } =
    useWallet();

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
      <Card key={useId()} className="flex w-full flex-col gap-2 px-7 py-5">
        {selectedAccount?.address && (
          <div className="flex gap-3 items-center mb-4">
            <Image
              src="/wallet-info-logo.svg"
              alt="Wallet Info Logo"
              width={24}
              height={24}
            />

            <CopyButton
              className="hover:text-muted-foreground h-fit p-0 text-sm"
              variant="link"
              copy={selectedAccount.address}
            >
              {smallAddress(selectedAccount.address, 12)}
              <Copy />
            </CopyButton>
          </div>
        )}

        {balances.map(({ amount, icon, label }) => (
          <div key={label} className="flex flex-col mb-4">
            {!isLoading ? (
              <p className="text-muted-foreground flex items-end gap-3 text-white font-bold mb-2">
                {formatToken(amount)}
                <span>TOR</span>
              </p>
            ) : (
              <Skeleton className="w-1/2 py-3" />
            )}
            <span className="flex items-center gap-2 text-sm text-[#A1A1AA]">
              {icon} {label}
            </span>
          </div>
        ))}
      </Card>
      <RewardIntervalProgress />
    </div>
  );
}
