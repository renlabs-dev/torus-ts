"use client";

import {
  formatToken,
  smallAddress,
  smallWalletName,
} from "@torus-ts/utils/subspace";
import { Copy, Lock, LockOpen, Wallet } from "lucide-react";
import { CopyButton } from "../copy-button";
import { DropdownMenuLabel, DropdownMenuSeparator } from "../dropdown-menu";

import { cn } from "../../lib/utils";
import { InjectedAccountWithMeta, StakeOutData } from "./wallet-dropdown";
import { useMemo } from "react";

interface WalletInfoProps {
  selectedAccount: InjectedAccountWithMeta;
  balance: bigint | undefined;
  stakeOut: StakeOutData | undefined;
}

export const WalletInfo = ({
  selectedAccount,
  balance,
  stakeOut,
}: WalletInfoProps) => {
  const userStakeWeight = useMemo(
    () => stakeOut?.perAddr[selectedAccount.address] ?? 0n,
    [stakeOut, selectedAccount],
  );

  const userTotal = useMemo(
    () => userStakeWeight + (balance ?? 0n),
    [userStakeWeight, balance],
  );

  const walletBalances = [
    {
      label: "Balance",
      value: formatToken(balance ?? 0n),
      icon: <LockOpen size={17} />,
    },
    {
      label: "Staked",
      value: formatToken(userStakeWeight),
      icon: <Lock size={17} />,
    },
    ...(userStakeWeight > 0n
      ? [
          {
            label: "Total",
            value: formatToken(userTotal),
            icon: <Wallet size={17} />,
          },
        ]
      : []),
  ];

  return (
    <>
      <DropdownMenuLabel className={cn("flex items-center justify-between")}>
        <div className={cn("flex flex-col gap-1")}>
          <span>{smallWalletName(selectedAccount.meta.name!, 15)}</span>
          <span className={cn("text-xs text-muted-foreground")}>
            {smallAddress(selectedAccount.address)}
          </span>
        </div>
        <CopyButton
          copy={selectedAccount.address}
          className={cn("h-fit p-0 text-muted-foreground hover:text-white")}
          variant="ghost"
        >
          <Copy size={17} />
        </CopyButton>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      {walletBalances.map(({ label, value, icon }) => (
        <DropdownMenuLabel
          key={label}
          className={cn("flex w-full items-center justify-between")}
        >
          <span className={cn("flex items-center gap-2")}>
            {icon}
            {label}
          </span>
          <span className={cn("text-xs text-muted-foreground")}>
            {value} TORUS
          </span>
        </DropdownMenuLabel>
      ))}
      <DropdownMenuSeparator />
    </>
  );
};
