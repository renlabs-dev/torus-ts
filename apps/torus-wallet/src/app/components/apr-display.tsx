"use client";

import { useEffect, useState } from "react";
import { useTorus } from "@torus-ts/torus-provider";
import {
  useTotalIssuance,
  useTotalStake,
} from "@torus-ts/query-provider/hooks";
import { toNano } from "@torus-ts/utils/subspace";

const BLOCKS_IN_DAY = 10_800n;
const BLOCK_EMISSION = toNano(64_000) / BLOCKS_IN_DAY;
const HALVING_INTERVAL = toNano(144_000_000);

export function APRDisplay() {
  const { api } = useTorus();
  const totalStakeQuery = useTotalStake(api);
  const totalIssuanceQuery = useTotalIssuance(api);

  const [apr, setApr] = useState<number | null>(null);

  useEffect(() => {
    console.debug("APR calculation started:", {
      stakeData: totalStakeQuery.data?.toString(),
      issuanceData: totalIssuanceQuery.data?.toString(),
    });

    // Skip if data isn't available
    if (!totalStakeQuery.data || !totalIssuanceQuery.data) {
      console.debug("Missing data, skipping calculation");
      return;
    }

    try {
      const totalStakeBigInt = BigInt(totalStakeQuery.data.toString());
      const totalIssuanceBigInt = BigInt(totalIssuanceQuery.data.toString());

      console.debug("Initial values:", {
        totalStake: totalStakeBigInt.toString(),
        totalIssuance: totalIssuanceBigInt.toString(),
        HALVING_INTERVAL: HALVING_INTERVAL.toString(),
      });

      const halvingCount = Number(totalIssuanceBigInt / HALVING_INTERVAL);
      console.debug("Halving count:", halvingCount);

      let currentEmission = BLOCK_EMISSION >> BigInt(halvingCount);
      console.debug("Current emission after halving:", {
        BLOCK_EMISSION: BLOCK_EMISSION.toString(),
        currentEmission: currentEmission.toString(),
      });

      const notRecycled = 1.0;
      currentEmission =
        (currentEmission * BigInt(Math.floor(notRecycled * 100))) / 100n;
      console.debug(
        "Current emission after recycling:",
        currentEmission.toString(),
      );

      const dailyRewards = (BLOCKS_IN_DAY * currentEmission) / 2n;
      console.debug("Daily rewards calculation:", {
        BLOCKS_IN_DAY: BLOCKS_IN_DAY.toString(),
        currentEmission: currentEmission.toString(),
        dailyRewards: dailyRewards.toString(),
      });

      const yearlyRewards = dailyRewards * 365n;
      console.debug("Yearly rewards:", yearlyRewards.toString());

      const aprNumerator = yearlyRewards * 100n;
      console.debug("APR numerator:", aprNumerator.toString());

      const aprValue = Number(aprNumerator / totalStakeBigInt) / 1e18;
      console.debug("Final APR calculation:", {
        numerator: aprNumerator.toString(),
        denominator: totalStakeBigInt.toString(),
        finalApr: aprValue,
      });

      setApr(aprValue);
    } catch (error) {
      console.error("Error calculating APR:", error);
      setApr(null);
    }
  }, [
    totalStakeQuery.data,
    totalIssuanceQuery.data,
    totalStakeQuery.isLoading,
    totalIssuanceQuery.isLoading,
  ]);

  if (totalStakeQuery.isLoading || totalIssuanceQuery.isLoading) {
    return <div className="text-sm text-gray-500">Calculating APR...</div>;
  }

  if (totalStakeQuery.isError || totalIssuanceQuery.isError || apr === null) {
    return <div className="text-sm text-red-500">Unable to calculate APR</div>;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">APR:</span>
      <span className="text-sm text-green-500">{apr.toFixed(2)}%</span>
    </div>
  );
}
