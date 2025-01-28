"use client";

import { useWallet } from "@torus-ts/wallet-provider";
import { formatToken } from "@torus-ts/utils/subspace";

export function BalanceDisplay() {
  const { accountFreeBalance, accountStakedBy } = useWallet();

  const totalStaked =
    accountStakedBy.data?.reduce((acc, curr) => acc + curr.stake, 0n) ?? 0n;

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="flex gap-8">
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-primary">
            {formatToken(accountFreeBalance.data ?? 0n)}
          </span>
          <span className="text-sm text-muted-foreground">Free Balance</span>
        </div>
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-primary">
            {formatToken(totalStaked)}
          </span>
          <span className="text-sm text-muted-foreground">Staked Balance</span>
        </div>
      </div>
    </div>
  );
}
