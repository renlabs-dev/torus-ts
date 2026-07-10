"use client";

import type { ApiPromise } from "@polkadot/api";
import { APRBar } from "../apr-bar/apr-bar";
import { useAPR } from "./hooks";
import { useRewardIntervalProgress } from "./use-reward-interval";

interface APRBarClientProps {
  api?: ApiPromise | null;
}

export function APRBarClient({ api }: APRBarClientProps) {
  const finalApi = api ?? null;
  const { apr, isLoading, totalStake, totalIssuance } = useAPR(finalApi);
  const rewardIntervalProgress = useRewardIntervalProgress(finalApi);

  if (!apr) {
    return null;
  }

  return (
    <APRBar
      apr={apr}
      totalStake={totalStake}
      totalIssuance={totalIssuance}
      isLoading={isLoading}
      rewardIntervalProgress={rewardIntervalProgress}
    />
  );
}
