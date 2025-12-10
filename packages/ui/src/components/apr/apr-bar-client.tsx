"use client";

import type { ApiPromise } from "@polkadot/api";
import { useGetTorusPrice } from "@torus-ts/query-provider/hooks";
import { APRBar } from "../apr-bar/apr-bar";
import { useAPR } from "./hooks";
import { useRewardIntervalProgress } from "./use-reward-interval";

interface APRBarClientProps {
  api?: ApiPromise | null;
}

export function APRBarClient({ api }: APRBarClientProps) {
  const finalApi = api ?? null;
  const { apr, isLoading, totalStake, totalIssuance } = useAPR(finalApi);
  const { data: usdPrice } = useGetTorusPrice();
  const rewardIntervalProgress = useRewardIntervalProgress(finalApi);

  if (!apr) {
    return null;
  }

  return (
    <APRBar
      apr={apr}
      usdPrice={usdPrice}
      totalStake={totalStake}
      totalIssuance={totalIssuance}
      isLoading={isLoading}
      rewardIntervalProgress={rewardIntervalProgress}
    />
  );
}
