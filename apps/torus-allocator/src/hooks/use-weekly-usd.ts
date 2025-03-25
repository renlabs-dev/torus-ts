import {
  useGetTorusPrice,
  useRecyclingPercentage,
  useTreasuryEmissionFee,
  useIncentivesRatio,
} from "@torus-ts/query-provider/hooks";
import { CONSTANTS } from "@torus-ts/subspace";
import { useTorus } from "@torus-ts/torus-provider";
import { useMemo } from "react";
import { api as extAPI } from "~/trpc/react";

interface AgentUsdCalculationResult {
  isLoading: boolean;
  isError: boolean;
  tokensPerWeek: number;
  usdValue: number;
  displayTokensPerWeek: string;
  displayUsdValue: string;
}

interface WeeklyUsdCalculationProps {
  agentKey: string;
  weightFactor: number | null;
}

export function useWeeklyUsdCalculation(
  props: WeeklyUsdCalculationProps,
): AgentUsdCalculationResult {
  // Queries the Torus dolar Brice (<- lol) from Coingecko
  // Wrap the useGetTorusPrice with additional configuration to prevent excessive refreshing
  const {
    data: torusPrice,
    isLoading: isTorusPriceLoading,
    isError: isTorusPriceError,
  } = useGetTorusPrice();
  // Use local torusPrice state with caching configuration
  // Queries the computed weight of the agent
  const {
    data: computedWeightedAgents,
    isLoading: isComputedWeightLoading,
    isError: isComputedWeightError,
  } = extAPI.computedAgentWeight.byAgentKey.useQuery(
    {
      agentKey: props.agentKey,
    },
    {
      refetchOnWindowFocus: false, // Don't refetch when the window regains focus
      refetchOnMount: false, // Don't refetch when the component mounts
    },
  );

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

  // Loads all queries at once, and if any of them are wrong, the whole result is wrong
  const isLoading =
    isTorusPriceLoading ||
    isComputedWeightLoading ||
    isRecyclingPercentageLoading ||
    isTreasuryEmissionFeeLoading ||
    isIncentivesRatioLoading ||
    computedWeightedAgents === undefined;

  const isError =
    isTorusPriceError ||
    isComputedWeightError ||
    isRecyclingPercentageError ||
    isTreasuryEmissionFeeError ||
    isIncentivesRatioError;

  // Calculate tokens per week
  const tokensPerWeek = useMemo(() => {
    // Early return conditions
    if (isLoading || isError || !computedWeightedAgents.computedWeight)
      return 0;

    // Constants and input parameters (keeping percentage values)
    const BLOCKS_PER_WEEK =
      CONSTANTS.TIME.ONE_WEEK / CONSTANTS.TIME.BLOCK_TIME_SECONDS;
    const fullWeeklyEmission =
      CONSTANTS.EMISSION.BLOCK_EMISSION * BLOCKS_PER_WEEK;

    // Parse values, providing defaults if null/undefined
    const incentivesRatioValue = Number(incentivesRatio) || 100;
    const recyclingRateValue = Number(recyclingPercentage) || 0;
    const treasuryFeeValue = Number(treasuryEmissionFee) || 1;
    const weightPenaltyValue = props.weightFactor ?? 1;
    const agentWeightValue = computedWeightedAgents.percComputedWeight * 100; // Assuming this is already decimal

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

    return (
      effectiveEmissionAmount *
      (incentivesRatioValue / 100) *
      (agentWeightValue / 100) *
      (1 - weightPenaltyValue / 100)
    );
  }, [
    isLoading,
    isError,
    computedWeightedAgents,
    incentivesRatio,
    recyclingPercentage,
    treasuryEmissionFee,
    props.weightFactor,
  ]);

  // Calculate USD value of weekly tokens
  const usdValue = useMemo(() => {
    if (isLoading || isError || !torusPrice) return 0;
    return tokensPerWeek * torusPrice;
  }, [isLoading, isError, tokensPerWeek, torusPrice]);

  // EXAMPLE: 5000000.00000 will be displayed: 5,000,000.00 TORUS
  const displayTokensPerWeek = useMemo(() => {
    if (isLoading || isError) return "0.00 TORUS";
    return (
      tokensPerWeek.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + " TORUS"
    );
  }, [isLoading, isError, tokensPerWeek]);

  // EXAMPLE: 50000.0000 will be displayed: $50,000.00
  const displayUsdValue = useMemo(() => {
    if (isLoading || isError) return "$0.00";
    return usdValue.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }, [isLoading, isError, usdValue]);

  return {
    tokensPerWeek,
    usdValue,
    isLoading,
    isError,
    displayTokensPerWeek,
    displayUsdValue,
  };
}
