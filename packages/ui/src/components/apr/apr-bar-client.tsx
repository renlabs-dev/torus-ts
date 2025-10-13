"use client";

import type { ApiPromise } from "@polkadot/api";
import { useGetTorusPrice } from "@torus-ts/query-provider/hooks";
import { APRBar } from "../apr-bar/apr-bar";
import { useAPR } from "./hooks";
import { useRewardIntervalProgress } from "./use-reward-interval";

interface APRBarClientProps {
  api?: ApiPromise | null;
}

/**
 * Render an APRBar component populated with APR, staking, pricing, and reward interval data.
 *
 * @param api - Optional Polkadot ApiPromise instance used to fetch APR and staking data; pass `null` or omit to operate without an RPC API.
 * @returns The APRBar element configured with computed `apr`, `usdPrice`, `totalStake`, `totalIssuance`, `isLoading`, and `rewardIntervalProgress`, or `null` if `apr` is unavailable.
 */
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