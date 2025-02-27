"use client";

import {
  formatToken,
  smallAddress,
  smallWalletName,
} from "@torus-ts/utils/subspace";
import { Copy, Lock, LockOpen } from "lucide-react";
import { CopyButton } from "./copy-button";
import { DropdownMenuLabel, DropdownMenuSeparator } from "./dropdown-menu";

import { cn } from "../lib/utils";
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
    () => stakeOut?.perAddr[selectedAccount?.address ?? ""] ?? 0n,
    [stakeOut, selectedAccount],
  );

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
      <DropdownMenuLabel className={cn("flex w-full justify-between")}>
        <span className={cn("flex items-center gap-2")}>
          <LockOpen size={17} />
          Balance
        </span>
        <span className={cn("items-center text-xs text-muted-foreground")}>
          {formatToken(balance ?? 0n)} TORUS
        </span>
      </DropdownMenuLabel>
      <DropdownMenuLabel
        className={cn("flex w-full items-center justify-between")}
      >
        <span className={cn("flex items-center gap-2")}>
          <Lock size={17} />
          Staked
        </span>
        <span className={cn("text-xs text-muted-foreground")}>
          {formatToken(userStakeWeight)} TORUS
        </span>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
    </>
  );
};
