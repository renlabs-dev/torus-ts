"use client";

import React, { useEffect, useState } from "react";
import { useTorus } from "@torus-ts/torus-provider";

import { toNano } from "@torus-ts/utils/subspace";
import { RunningAPRBar } from "./running-apr-bar";
import {
  useRecyclingPercentage,
  useTotalIssuance,
  useTotalStake,
  useTreasuryEmissionFee,
} from "@torus-ts/query-provider/hooks";

const BLOCKS_IN_DAY = 10_800n;
const BLOCK_EMISSION = toNano(64_000) / BLOCKS_IN_DAY;
const HALVING_INTERVAL = toNano(144_000_000);

export function APRDisplay() {
  const { api } = useTorus();
  const totalStakeQuery = useTotalStake(api);
  const totalIssuanceQuery = useTotalIssuance(api);
  const recyclingPercentageQuery = useRecyclingPercentage(api);
  const treasuryEmissionFeeQuery = useTreasuryEmissionFee(api);

  const [apr, setApr] = useState<number | null>(null);

  // TODO: refactor functor-flow shit code
  useEffect(() => {
    if (
      !totalStakeQuery.data ||
      !totalIssuanceQuery.data ||
      recyclingPercentageQuery.data === undefined ||
      treasuryEmissionFeeQuery.data === undefined
    ) {
      console.debug("Missing data, skipping calculation");
      return;
    }

    try {
      const totalStakeBigInt = BigInt(totalStakeQuery.data.toString());
      const totalFreeBalance = BigInt(totalIssuanceQuery.data.toString());
      const totalSupply = totalStakeBigInt + totalFreeBalance;
      const recyclingRate = Number(recyclingPercentageQuery.data) / 100;
      const treasuryFee = Number(treasuryEmissionFeeQuery.data) / 100;
      const halvingCount = Number(totalSupply / HALVING_INTERVAL);

      let currentEmission = BLOCK_EMISSION >> BigInt(halvingCount);
      const notRecycled = 1.0 - recyclingRate;
      currentEmission =
        (currentEmission * BigInt(Math.floor(notRecycled * 100))) / 100n;

      const dailyRewards = (BLOCKS_IN_DAY * currentEmission) / 2n;
      const yearlyRewards = dailyRewards * 365n;
      const rewardsAfterTreasuryFee =
        (yearlyRewards * BigInt(Math.floor((1 - treasuryFee) * 100))) / 100n;

      const stakingAmount =
        totalStakeBigInt === 0n ? totalFreeBalance : totalStakeBigInt;
      const aprNumerator = rewardsAfterTreasuryFee * 100n;
      const aprValue = Number(aprNumerator / stakingAmount);

      setApr(aprValue);
    } catch (error) {
      console.error("Error calculating APR:", error);
      setApr(null);
    }
  }, [
    totalStakeQuery.data,
    totalIssuanceQuery.data,
    recyclingPercentageQuery.data,
    treasuryEmissionFeeQuery.data,
  ]);

  if (
    totalStakeQuery.isLoading ||
    totalIssuanceQuery.isLoading ||
    recyclingPercentageQuery.isLoading ||
    treasuryEmissionFeeQuery.isLoading
  ) {
    return (
      <div className="w-full">
        <div className="absolute top-14 text-center text-sm text-gray-500">
          Calculating APR...
        </div>
      </div>
    );
  }

  if (
    totalStakeQuery.isError ||
    totalIssuanceQuery.isError ||
    recyclingPercentageQuery.isError ||
    treasuryEmissionFeeQuery.isError ||
    apr === null
  ) {
    return (
      <div className="absolute top-14 w-full">
        <div className="text-center text-sm text-red-500">
          Unable to calculate APR
        </div>
      </div>
    );
  }

  return (
    <div className="absolute top-14 w-full">
      <RunningAPRBar
        apr={apr}
        totalStaked={BigInt(totalStakeQuery.data?.toString() ?? "0")}
        totalSupply={
          BigInt(totalStakeQuery.data?.toString() ?? "0") +
          BigInt(totalIssuanceQuery.data?.toString() ?? "0")
        }
      />
    </div>
  );
}
