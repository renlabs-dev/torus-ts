import { toNano } from "@torus-network/torus-utils/subspace";
import {
  useIncentivesRatio,
  useRecyclingPercentage,
  useTotalIssuance,
  useTotalStake,
  useTreasuryEmissionFee,
} from "@torus-ts/query-provider/hooks";
import { useTorus } from "@torus-ts/torus-provider";
import { useMemo } from "react";

const BLOCKS_IN_DAY = 10_800n;
const BLOCK_EMISSION = toNano(64_000) / BLOCKS_IN_DAY;
const HALVING_INTERVAL = toNano(144_000_000);

interface APRResult {
  apr: number | null;
  isLoading: boolean;
  isError: boolean;
  totalStake: bigint | undefined;
  totalIssuance: unknown;
}

/**
 * Calculate the Annual Percentage Rate (APR)
 */
function calculateAPR(
  totalStake: bigint,
  totalFreeBalance: bigint,
  recyclingRate: number,
  treasuryFee: number,
  incentivesRatio: number,
): number | null {
  // Calculate total supply and halving count
  const totalSupply = totalStake + totalFreeBalance;
  const halvingCount = Number(totalSupply / HALVING_INTERVAL);

  // Calculate emission with recycling
  const currentEmission = calculateEmissionRate(halvingCount, recyclingRate);

  // Calculate yearly rewards
  const yearlyRewards = calculateYearlyRewards(
    currentEmission,
    incentivesRatio,
    treasuryFee,
  );

  // Calculate APR
  const stakingAmount = totalStake === 0n ? totalFreeBalance : totalStake;
  if (stakingAmount === 0n) return null;

  const aprNumerator = yearlyRewards * 100n;
  return Number(aprNumerator / stakingAmount);
}

/**
 * Calculate emission rate with recycling applied
 */
function calculateEmissionRate(
  halvingCount: number,
  recyclingRate: number,
): bigint {
  const baseEmission = BLOCK_EMISSION >> BigInt(halvingCount);
  const notRecycled = 1.0 - recyclingRate;
  return (baseEmission * BigInt(Math.floor(notRecycled * 100))) / 100n;
}

/**
 * Calculate yearly rewards with incentives and treasury fee applied
 */
function calculateYearlyRewards(
  currentEmission: bigint,
  incentivesRatio: number,
  treasuryFee: number,
): bigint {
  const PRECISION = 10n ** 18n; // 10^18 for high precision

  // Convert ratios to bigint with precision
  const incentivesRatioScaled = BigInt(
    Math.round(incentivesRatio * Number(PRECISION)),
  );
  const treasuryFeeScaled = BigInt(Math.round(treasuryFee * Number(PRECISION)));

  // Calculate stake rewards ratio (1 - incentivesRatio)
  const stakeRewardsRatioScaled = PRECISION - incentivesRatioScaled;

  // Daily rewards: (blocks * emission * stakeRewardsRatio)
  const dailyRewardsScaled =
    (BLOCKS_IN_DAY * currentEmission * stakeRewardsRatioScaled) / PRECISION;

  // Yearly rewards: daily * 365
  const yearlyRewardsScaled = dailyRewardsScaled * 365n;

  // Apply treasury fee: (1 - treasuryFee)
  const finalRewardsScaled =
    (yearlyRewardsScaled * (PRECISION - treasuryFeeScaled)) / PRECISION;

  return finalRewardsScaled;
}

export function useAPR(): APRResult {
  const { api } = useTorus();

  const totalStakeQuery = useTotalStake(api);
  const totalIssuanceQuery = useTotalIssuance(api);
  const recyclingPercentageQuery = useRecyclingPercentage(api);
  const treasuryEmissionFeeQuery = useTreasuryEmissionFee(api);
  const incentivesRatioQuery = useIncentivesRatio(api);

  const queries = useMemo(
    () => [
      totalStakeQuery,
      totalIssuanceQuery,
      recyclingPercentageQuery,
      treasuryEmissionFeeQuery,
      incentivesRatioQuery,
    ],
    [
      totalStakeQuery,
      totalIssuanceQuery,
      recyclingPercentageQuery,
      treasuryEmissionFeeQuery,
      incentivesRatioQuery,
    ],
  );

  const isAnyLoading = useMemo(
    () => queries.some((query) => query.isPending),
    [queries],
  );

  const isAnyError = useMemo(
    () => queries.some((query) => query.isError),
    [queries],
  );

  const isDataComplete = useMemo(
    () => queries.every((query) => !!query.data),
    [queries],
  );

  const apr = useMemo(() => {
    if (!isDataComplete) return null;

    try {
      const totalStake = BigInt(totalStakeQuery.data?.toString() ?? "0");
      const totalFreeBalance = BigInt(
        totalIssuanceQuery.data?.toString() ?? "0",
      );

      const recyclingRate = Number(recyclingPercentageQuery.data) / 100;
      const treasuryFee = Number(treasuryEmissionFeeQuery.data) / 100;
      const incentivesRatio = Number(incentivesRatioQuery.data) / 100;

      return calculateAPR(
        totalStake,
        totalFreeBalance,
        recyclingRate,
        treasuryFee,
        incentivesRatio,
      );
    } catch (error) {
      console.error("Error calculating APR:", error);
      return null;
    }
  }, [
    isDataComplete,
    totalStakeQuery.data,
    totalIssuanceQuery.data,
    recyclingPercentageQuery.data,
    treasuryEmissionFeeQuery.data,
    incentivesRatioQuery.data,
  ]);

  return {
    apr,
    isLoading: isAnyLoading,
    isError: isAnyError,
    totalStake: totalStakeQuery.data,
    totalIssuance: totalIssuanceQuery.data,
  };
}
