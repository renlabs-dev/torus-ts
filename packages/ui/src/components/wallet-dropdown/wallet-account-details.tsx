"use client";

import {
  smallAddress,
  smallWalletName,
} from "@torus-network/torus-utils/torus/address";
import { formatToken } from "@torus-network/torus-utils/torus/token";

import { cn } from "@torus-ts/ui/lib/utils";

import type { InjectedAccountWithMeta } from "./wallet-dropdown";

interface AccountDetailsProps {
  account: InjectedAccountWithMeta;
  totalBalance: (account: InjectedAccountWithMeta) => bigint;
}

export const WalletAccountDetails = ({
  account,
  totalBalance,
}: AccountDetailsProps) => (
  <div className={cn("flex w-full flex-col gap-2")}>
    <span className={cn("flex flex-col items-start justify-start gap-1")}>
      <span className="flex w-full items-center justify-between">
        <span className="truncate text-sm">
          {smallWalletName(account.meta.name ?? "Unnamed Wallet", 15)}
        </span>
        <span className={cn("text-xs text-muted-foreground")}>
          {`${formatToken(totalBalance(account))}`}
        </span>
      </span>
      <span className={cn("text-xs text-muted-foreground")}>
        {smallAddress(account.address, 16)}
      </span>
    </span>
  </div>
);
