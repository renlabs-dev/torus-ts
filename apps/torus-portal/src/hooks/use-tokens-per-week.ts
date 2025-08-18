import { useMemo } from "react";

import { CONSTANTS } from "@torus-network/sdk/constants";

import {
  useIncentivesRatio,
  useRecyclingPercentage,
  useTreasuryEmissionFee,
} from "@torus-ts/query-provider/hooks";
import { useTorus } from "@torus-ts/torus-provider";

interface TokensPerWeekResult {
  isLoading: boolean;
  isError: boolean;
  baseWeeklyTokens: number;
  effectiveEmissionAmount: number;
  incentivesRatioValue: number;
  recyclingRateValue: number;
  treasuryFeeValue: number;
}

/**
 * Calculates the base tokens per week before agent-specific adjustments.
 * This provides the effective emission amount after accounting for recycling and treasury fees.
 */
export function useTokensPerWeek(): TokensPerWeekResult {
  const { api } = useTorus();

  // Gets the information of Recycling Percentage
  const {
    data: recyclingPercentage,
    isLoading: isRecyclingPercentageLoading,
    isError: isRecyclingPercentageError,
  } = useRecyclingPercentage(api);

  // Gets the information of Treasury Emission Fee
  const {
    data: treasuryEmissionFee,
    isLoading: isTreasuryEmissionFeeLoading,
    isError: isTreasuryEmissionFeeError,
  } = useTreasuryEmissionFee(api);

  // Gets the information of Incentives Ratio
  const {
    data: incentivesRatio,
    isLoading: isIncentivesRatioLoading,
    isError: isIncentivesRatioError,
  } = useIncentivesRatio(api);

  const isLoading =
    isRecyclingPercentageLoading ||
    isTreasuryEmissionFeeLoading ||
    isIncentivesRatioLoading;

  const isError =
    isRecyclingPercentageError ||
    isTreasuryEmissionFeeError ||
    isIncentivesRatioError;

  // Calculate effective emission amount and base weekly tokens
  const {
    baseWeeklyTokens,
    effectiveEmissionAmount,
    incentivesRatioValue,
    recyclingRateValue,
    treasuryFeeValue,
  } = useMemo(() => {
    // Early return conditions
    if (isLoading || isError) {
      return {
        baseWeeklyTokens: 0,
        effectiveEmissionAmount: 0,
        incentivesRatioValue: 0,
        recyclingRateValue: 0,
        treasuryFeeValue: 0,
      };
    }

    // Constants and input parameters (keeping percentage values)
    const BLOCKS_PER_WEEK =
      CONSTANTS.TIME.ONE_WEEK / CONSTANTS.TIME.BLOCK_TIME_SECONDS;
    const fullWeeklyEmission =
      CONSTANTS.EMISSION.BLOCK_EMISSION * BLOCKS_PER_WEEK;

    // Parse values, providing defaults if null/undefined
    const incentivesRatioValue = Number(incentivesRatio) || 100;
    const recyclingRateValue = Number(recyclingPercentage) || 0;
    const treasuryFeeValue = Number(treasuryEmissionFee) || 1;

    // Calculate emission percentage accounting for recycling
    const emissionRemainderPercent = 100 - recyclingRateValue;

    // Calculate the treasury fee amount
    const treasuryFeeAmount =
      (emissionRemainderPercent * treasuryFeeValue) / 100;

    // Calculate the effective emission percentage
    const effectiveEmissionPercent =
      emissionRemainderPercent - treasuryFeeAmount;

    const effectiveEmissionAmount =
      (effectiveEmissionPercent / 100) * fullWeeklyEmission;

    // Calculate base weekly tokens with incentives ratio
    const baseWeeklyTokens =
      effectiveEmissionAmount * (incentivesRatioValue / 100);

    return {
      baseWeeklyTokens,
      effectiveEmissionAmount,
      incentivesRatioValue,
      recyclingRateValue,
      treasuryFeeValue,
    };
  }, [
    isLoading,
    isError,
    incentivesRatio,
    recyclingPercentage,
    treasuryEmissionFee,
  ]);

  return {
    isLoading,
    isError,
    baseWeeklyTokens,
    effectiveEmissionAmount,
    incentivesRatioValue,
    recyclingRateValue,
    treasuryFeeValue,
  };
}

/**
 * Calculates tokens per week for a specific agent weight and penalty.
 * @param effectiveEmissionAmount - The base emission amount after recycling and treasury fees
 * @param incentivesRatioValue - The incentives ratio percentage
 * @param agentWeightValue - The agent's weight percentage (0-100)
 * @param weightPenaltyValue - The weight penalty percentage (0-100)
 */
export function calculateAgentTokensPerWeek(
  effectiveEmissionAmount: number,
  incentivesRatioValue: number,
  agentWeightValue: number,
  weightPenaltyValue: number,
): number {
  return (
    effectiveEmissionAmount *
    (incentivesRatioValue / 100) *
    (agentWeightValue / 100) *
    (1 - weightPenaltyValue / 100)
  );
}
