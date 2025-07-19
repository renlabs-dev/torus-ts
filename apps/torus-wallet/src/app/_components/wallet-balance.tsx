"use client";

import { Suspense, useMemo } from "react";

import { Copy, Lock, Scale, Unlock } from "lucide-react";
import Image from "next/image";

import { smallAddress } from "@torus-network/torus-utils/torus/address";
import { formatToken } from "@torus-network/torus-utils/torus/token";

import { Card } from "@torus-ts/ui/components/card";
import { CopyButton } from "@torus-ts/ui/components/copy-button";
import { Skeleton } from "@torus-ts/ui/components/skeleton";

import { useWallet } from "~/context/wallet-provider";

import { TorusAnimation } from "./torus-animation";

const BALANCE_ICONS = {
  free: <Unlock size={16} />,
  staked: <Lock size={16} />,
  total: <Scale size={16} />,
};

interface BalanceItemProps {
  amount: bigint;
  icon: React.ReactNode;
  label: string;
  isLoading: boolean;
}

interface WalletHeaderProps {
  address: string | undefined;
}

function BalanceItem({ amount, icon, label, isLoading }: BalanceItemProps) {
  return (
    <div key={label} className="flex flex-col">
      {!isLoading ? (
        <p className="text-muted-foreground flex items-end gap-2 font-bold text-white">
          {formatToken(amount)}
          <span>TORUS</span>
        </p>
      ) : (
        <Skeleton className="w-1/2 py-3" />
      )}
      <span className="flex items-center gap-2 text-sm text-[#A1A1AA]">
        {icon} {label}
      </span>
    </div>
  );
}

function WalletHeader({ address }: WalletHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-8 w-8 flex-shrink-0">
        <Image
          src="/wallet-info-logo.svg"
          alt="Wallet Info Logo"
          width={32}
          height={32}
        />
      </div>
      {address ? (
        <CopyButton
          className="text-muted-foreground h-fit p-0 !text-base hover:text-white"
          variant="ghost"
          copy={address}
        >
          {smallAddress(address, 9)}
          <Copy aria-hidden="true" className="ml-1" />
          <span className="sr-only">Copy address</span>
        </CopyButton>
      ) : (
        <span className="text-muted-foreground">Connect Wallet</span>
      )}
    </div>
  );
}

export function WalletBalance() {
  const { accountFreeBalance, accountStakedBalance, selectedAccount } =
    useWallet();

  const getBalance = useMemo(() => {
    const free = accountFreeBalance.data ?? 0n;
    const staked = accountStakedBalance ?? 0n;

    return { free, staked };
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
  ];

  const isLoading = accountFreeBalance.isLoading;

  return (
    <div className="xs:flex-row flex min-h-fit flex-col lg:flex-col">
      <Card className="flex w-full flex-col gap-[2.40em] px-7 py-5 relative">
        <div className="absolute inset-0 overflow-hidden opacity-20 z-0">
          <Suspense fallback={null}>
            <TorusAnimation />
          </Suspense>
        </div>
        <div className="relative z-10 gap-10 flex flex-col">
          <WalletHeader address={selectedAccount?.address} />
          <div className="flex flex-col gap-[1.85em]">
            {balances.map((balance) => (
              <BalanceItem
                key={balance.label}
                amount={balance.amount}
                icon={balance.icon}
                label={balance.label}
                isLoading={isLoading}
              />
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
