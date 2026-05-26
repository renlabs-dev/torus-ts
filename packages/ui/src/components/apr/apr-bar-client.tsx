"use client";

import type { ApiPromise } from "@polkadot/api";
import { useGetTorusPrice } from "@torus-ts/query-provider/hooks";
import { APRBar } from "../apr-bar/apr-bar";
import { useAPR } from "./hooks";
import { useRewardIntervalProgress } from "./use-reward-interval";

interface APRBarClientProps {
  api?: ApiPromise | null;
  showUsdPrice?: boolean;
}

export function APRBarClient({ api, showUsdPrice = true }: APRBarClientProps) {
  const finalApi = api ?? null;
  const { apr, isLoading, totalStake, totalIssuance } = useAPR(finalApi);
  const { data: usdPrice } = useGetTorusPrice({ enabled: showUsdPrice });
  const rewardIntervalProgress = useRewardIntervalProgress(finalApi);

  if (!apr) {
    return null;
  }

  return (
    <APRBar
      apr={apr}
      showUsdPrice={showUsdPrice}
      usdPrice={showUsdPrice ? usdPrice : undefined}
      totalStake={totalStake}
      totalIssuance={totalIssuance}
      isLoading={isLoading}
      rewardIntervalProgress={rewardIntervalProgress}
    />
  );
}
