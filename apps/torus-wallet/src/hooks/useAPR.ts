import { useMemo } from "react";
import { useTorus } from "@torus-ts/torus-provider";
import {
  useRecyclingPercentage,
  useTotalIssuance,
  useTotalStake,
  useTreasuryEmissionFee,
  useIncentivesRatio,
} from "@torus-ts/query-provider/hooks";
import { toNano } from "@torus-ts/utils/subspace";

const BLOCKS_IN_DAY = 10_800n;
const BLOCK_EMISSION = toNano(64_000) / BLOCKS_IN_DAY;
const HALVING_INTERVAL = toNano(144_000_000);

interface APRResult {
  apr: number | null;
  isLoading: boolean;
  isError: boolean;
  totalStake: unknown;
  totalIssuance: unknown;
}

export function useAPR(): APRResult {
  const { api } = useTorus();
  const totalStakeQuery = useTotalStake(api);
  const totalIssuanceQuery = useTotalIssuance(api);
  const recyclingPercentageQuery = useRecyclingPercentage(api);
  const treasuryEmissionFeeQuery = useTreasuryEmissionFee(api);
  const incentivesRatioQuery = useIncentivesRatio(api);

  const apr = useMemo(() => {
    // Check if all data is available
    if (
      !totalStakeQuery.data ||
      !totalIssuanceQuery.data ||
      !recyclingPercentageQuery.data ||
      !treasuryEmissionFeeQuery.data ||
      !incentivesRatioQuery.data
    ) {
      return null;
    }

    try {
      const totalStake = BigInt(totalStakeQuery.data.toString());
      const totalFreeBalance = BigInt(totalIssuanceQuery.data.toString());
      const recyclingRate = Number(recyclingPercentageQuery.data) / 100;
      const treasuryFee = Number(treasuryEmissionFeeQuery.data) / 100;
      const incentivesRatio = Number(incentivesRatioQuery.data) / 100;

      // Calculate total supply and halving count
      const totalSupply = totalStake + totalFreeBalance;
      const halvingCount = Number(totalSupply / HALVING_INTERVAL);

      // Calculate emission with recycling rate
      let currentEmission = BLOCK_EMISSION >> BigInt(halvingCount);
      const notRecycled = 1.0 - recyclingRate;
      currentEmission = (currentEmission * BigInt(Math.floor(notRecycled * 100))) / 100n;

      // Calculate rewards with incentives ratio
      const stakeRewardsRatio = 1 - incentivesRatio;
      const dailyRewards = (BLOCKS_IN_DAY * currentEmission * BigInt(Math.floor(stakeRewardsRatio * 100))) / 100n;
      const yearlyRewards = dailyRewards * 365n;
      const rewardsAfterTreasuryFee = (yearlyRewards * BigInt(Math.floor((1 - treasuryFee) * 100))) / 100n;

      // Calculate APR
      const stakingAmount = totalStake === 0n ? totalFreeBalance : totalStake;
      if (stakingAmount === 0n) return null;

      const aprNumerator = rewardsAfterTreasuryFee * 100n;
      return Number(aprNumerator / stakingAmount);
    } catch (error) {
      console.error("Error calculating APR:", error);
      return null;
    }
  }, [
    totalStakeQuery.data,
    totalIssuanceQuery.data,
    recyclingPercentageQuery.data,
    treasuryEmissionFeeQuery.data,
    incentivesRatioQuery.data,
  ]);

  return {
    apr,
    isLoading:
      totalStakeQuery.isLoading ||
      totalIssuanceQuery.isLoading ||
      recyclingPercentageQuery.isLoading ||
      treasuryEmissionFeeQuery.isLoading ||
      incentivesRatioQuery.isLoading,
    isError:
      totalStakeQuery.isError ||
      totalIssuanceQuery.isError ||
      recyclingPercentageQuery.isError ||
      treasuryEmissionFeeQuery.isError ||
      incentivesRatioQuery.isError,
    totalStake: totalStakeQuery.data,
    totalIssuance: totalIssuanceQuery.data,
  };
}
