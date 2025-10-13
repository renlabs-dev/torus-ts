"use client";

import type { Api } from "@torus-network/sdk/chain";
import {
  useIncentivesRatio,
  useRecyclingPercentage,
  useTotalIssuance,
  useTotalStake,
  useTreasuryEmissionFee,
} from "@torus-ts/query-provider/hooks";
import { toNano } from "@torus-network/torus-utils/torus/token";
import { trySync } from "@torus-network/torus-utils/try-catch";
import type { Nullish } from "@torus-network/torus-utils/typing";
import { useMemo } from "react";

// == Constants ==

// TODO: refactor magic numbers
const BLOCKS_IN_DAY = 10_800n;
const BLOCK_EMISSION = toNano(64_000) / BLOCKS_IN_DAY;
const HALVING_INTERVAL = toNano(144_000_000);

// == Types ==

export interface APRResult {
  apr: number | null;
  isLoading: boolean;
  isError: boolean;
  totalStake: bigint | undefined;
  totalIssuance: bigint | undefined;
}

// == Internal Functions ==

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

  const aprBigInt = (yearlyRewards * 100n) / stakingAmount;
  return Number(aprBigInt);
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
 * Compute the total annual rewards allocated to stakers after applying the incentives share and treasury fee.
 *
 * @param currentEmission - Per-block emission amount as a bigint
 * @param incentivesRatio - Fraction in [0, 1] representing the portion reserved for incentives (not for stakers)
 * @param treasuryFee - Fraction in [0, 1] representing the treasury fee applied to yearly rewards
 * @returns The yearly rewards for stakers, returned as a bigint scaled by 10^18 (fixed-point precision)
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

// == Hooks ==

/**
 * Compute the current staking APR from on-chain metrics.
 *
 * @param api - The Substrate `Api` instance to use for queries, or `null`/`undefined` to disable queries.
 * @returns An `APRResult` containing the computed `apr` (percentage as a `number`, or `null` if unavailable), `isLoading` and `isError` flags, and the raw `totalStake` and `totalIssuance` values (or `undefined` if not present).
 */
export function useAPR(api: Api | Nullish): APRResult {
  const totalStakeQuery = useTotalStake(api);
  const totalIssuanceQuery = useTotalIssuance(api);
  const recyclingPercentageQuery = useRecyclingPercentage(api);
  const treasuryEmissionFeeQuery = useTreasuryEmissionFee(api);
  const incentivesRatioQuery = useIncentivesRatio(api);

  const isAnyLoading = useMemo(
    () =>
      totalStakeQuery.isPending ||
      totalIssuanceQuery.isPending ||
      recyclingPercentageQuery.isPending ||
      treasuryEmissionFeeQuery.isPending ||
      incentivesRatioQuery.isPending,
    [
      totalStakeQuery.isPending,
      totalIssuanceQuery.isPending,
      recyclingPercentageQuery.isPending,
      treasuryEmissionFeeQuery.isPending,
      incentivesRatioQuery.isPending,
    ],
  );

  const isAnyError = useMemo(
    () =>
      totalStakeQuery.isError ||
      totalIssuanceQuery.isError ||
      recyclingPercentageQuery.isError ||
      treasuryEmissionFeeQuery.isError ||
      incentivesRatioQuery.isError,
    [
      totalStakeQuery.isError,
      totalIssuanceQuery.isError,
      recyclingPercentageQuery.isError,
      treasuryEmissionFeeQuery.isError,
      incentivesRatioQuery.isError,
    ],
  );

  const isDataComplete = useMemo(
    () =>
      totalStakeQuery.data != null &&
      totalIssuanceQuery.data != null &&
      recyclingPercentageQuery.data != null &&
      treasuryEmissionFeeQuery.data != null &&
      incentivesRatioQuery.data != null,
    [
      totalStakeQuery.data,
      totalIssuanceQuery.data,
      recyclingPercentageQuery.data,
      treasuryEmissionFeeQuery.data,
      incentivesRatioQuery.data,
    ],
  );

  const apr = useMemo(() => {
    if (!isDataComplete) return null;

    const [error, result] = trySync(() => {
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
    });

    if (error !== undefined) {
      console.error("Error calculating APR:", error);
      return null;
    }

    return result;
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