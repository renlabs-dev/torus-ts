import {
  useGetTorusPrice,
  useRecyclingPercentage,
  useTreasuryEmissionFee,
  // useBlockEmission,
  // useIncentivesRatio,
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
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false, // Don't refetch when the window regains focus
      refetchOnMount: false, // Don't refetch when the component mounts
    },
  );

  const { api } = useTorus();

  // Gets the information of Recycling Percentage
  const { data: recyclingPercentage } = useRecyclingPercentage(api);

  // Gets the information of Treasury Emission Fee
  const { data: treasuryEmissionFee } = useTreasuryEmissionFee(api);

  // Loads all queries at once, and if any of them are wrong, the whole result is wrong
  const isLoading = isTorusPriceLoading || isComputedWeightLoading;
  const isError = isTorusPriceError || isComputedWeightError;

  // Calculate tokens per week
  const tokensPerWeek = useMemo(() => {
    if (!computedWeightedAgents?.computedWeight) return 0;

    // Blocks per week calculation
    const BLOCKS_PER_WEEK =
      CONSTANTS.TIME.ONE_WEEK / CONSTANTS.TIME.BLOCK_TIME_SECONDS;

    // Weight Factor is the penalty factor
    const weightPenaltyFactor = props.weightFactor ?? 1; // Default to 1 if not available

    // Calculate weekly emission in REMs and convert to tokens
    const fullWeeklyEmission =
      CONSTANTS.EMISSION.BLOCK_EMISSION * BLOCKS_PER_WEEK;

    // Converts the reciclyn rate to percentage
    const percReciclyngRate =
      (recyclingPercentage != null ? Number(recyclingPercentage) : 0) / 100;

    // Converts the treasury emission fee to percentage
    const percTreasuryEmissionFee =
      (treasuryEmissionFee != null ? Number(treasuryEmissionFee) : 0) / 100;

    const weeklyEmission =
      fullWeeklyEmission * (1 - (percReciclyngRate + percTreasuryEmissionFee));

    // Computed Weight but the percentage
    const percComputedWeight = computedWeightedAgents.percComputedWeight;

    // Penalty factor but the percentage
    const percWeightPenaltyFactor = weightPenaltyFactor / 100;

    // Emission * %Incentive * %Agent Weight * (1 - Penalty Factor)
    return (
      weeklyEmission *
      CONSTANTS.ECONOMY.INCENTIVES_RATIO *
      percComputedWeight *
      (1 - percWeightPenaltyFactor)
    );
  }, [
    recyclingPercentage,
    treasuryEmissionFee,
    computedWeightedAgents?.percComputedWeight,
    computedWeightedAgents?.computedWeight,
    props.weightFactor,
  ]);

  // Calculate USD value of weekly tokens
  const usdValue = useMemo(() => {
    if (!torusPrice) return 0;
    return tokensPerWeek * torusPrice;
  }, [tokensPerWeek, torusPrice]);

  // EXAMPLE: 5000000.00000 will be displayed: 5,000,000.00 TORUS
  const displayTokensPerWeek =
    tokensPerWeek.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " TORUS";

  // EXAMPLE: 50000.0000 will be displayed: $50,000.00
  const displayUsdValue = usdValue.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return {
    tokensPerWeek,
    usdValue,
    isLoading,
    isError,
    displayTokensPerWeek,
    displayUsdValue,
  };
}
