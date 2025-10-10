"use client";

import type { ApiPromise } from "@polkadot/api";
import { useGetTorusPrice } from "@torus-ts/query-provider/hooks";
import { useTorus } from "@torus-ts/torus-provider";
import { APRBar } from "../apr-bar/apr-bar";
import { useAPR } from "./hooks";
import { useRewardIntervalProgress } from "./use-reward-interval";

interface APRBarClientProps {
  api?: ApiPromise | null;
}

export function APRBarClient({ api }: APRBarClientProps = {}) {
  const { api: contextApi } = useTorus();
  const finalApi = api !== undefined ? api : contextApi;

  const { apr, isLoading, totalStake, totalIssuance } = useAPR(finalApi);
  const { data: usdPrice } = useGetTorusPrice();
  const rewardIntervalProgress = useRewardIntervalProgress(finalApi);

  return (
    <APRBar
      apr={apr ?? undefined}
      usdPrice={usdPrice}
      totalStake={totalStake}
      totalIssuance={totalIssuance}
      isLoading={isLoading}
      rewardIntervalProgress={rewardIntervalProgress}
    />
  );
}
