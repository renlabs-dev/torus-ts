"use client";

import type { APRData } from "./apr-bar";
import { AppBarDataGroup, AppBarSeparator } from "./apr-bar-shared";
import { formatToken } from "@torus-ts/utils/subspace";

export function APREntry({ apr, totalStake, stakedPercentage }: APRData) {
  return (
    <div className="flex items-center font-mono text-sm tracking-tight">
      <div className="flex items-center">
        <AppBarDataGroup label="APR" value={`${apr?.toFixed(2)}%`} />
        <AppBarSeparator />
        <AppBarDataGroup
          label="TOTAL STAKED"
          value={formatToken(totalStake ?? 0n)}
          unit="$TORUS"
        />
        <AppBarSeparator />
        <AppBarDataGroup
          label="STAKED RATIO"
          value={`${stakedPercentage.toFixed(2)}%`}
        />
      </div>
    </div>
  );
}
