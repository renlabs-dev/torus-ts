import {
  useBlockEmission,
  useGetTorusPrice,
  useIncentivesRatio,
} from "@torus-ts/query-provider/hooks";
import { ONE_WEEK, BLOCK_TIME_SECONDS } from "@torus-ts/subspace";
import { useTorus } from "@torus-ts/torus-provider";
import { fromNano } from "@torus-ts/utils/subspace";
import { useMemo } from "react";
import { api as extAPI } from "~/trpc/react";
import type { Agent } from "~/utils/types";

interface AgentUsdCalculationResult {
  isLoading: boolean;
  isError: boolean;
  tokensPerWeek: number;
  usdValue: string;
}

export function useWeeklyUsdCalculation(
  agent: Agent,
): AgentUsdCalculationResult {
  const { api } = useTorus();
  // Queries the emission
  const {
    data: emission,
    isLoading: isEmissionLoading,
    isError: isEmissionError,
  } = useBlockEmission(api);
  // Queries the Incentives Ratio
  const {
    data: incentivesRatio,
    isLoading: isIncentivesLoading,
    isError: isIncentivesError,
  } = useIncentivesRatio(api);
  // Queries the Torus dolar Brice from Coingecko
  const {
    data: torusPrice,
    isLoading: isTorusPriceLoading,
    isError: isTorusPriceError,
  } = useGetTorusPrice();
  // Queries the computed weight of the agent
  const {
    data: computedWeightedAgents,
    isLoading: isComputedWeightLoading,
    isError: isComputedWeightError,
  } = extAPI.computedAgentWeight.byAgentKey.useQuery({ agentKey: agent.key });

  // Loads all queries at once, and if any of them are wrong, the whole result is wrong
  const isLoading =
    isEmissionLoading ||
    isIncentivesLoading ||
    isTorusPriceLoading ||
    isComputedWeightLoading;

  const isError =
    isEmissionError ||
    isIncentivesError ||
    isTorusPriceError ||
    isComputedWeightError;

  // Calculate tokens per week
  const tokensPerWeek = useMemo(() => {
    if (
      !emission ||
      !incentivesRatio ||
      !computedWeightedAgents?.computedWeight
    )
      return 0;

    // Blocks per week calculation
    const BLOCKS_PER_WEEK = ONE_WEEK / BLOCK_TIME_SECONDS;
    const weightPenaltyFactor = agent.weightFactor ?? 1; // Default to 1 if not available

    // Calculate weekly emission in NANOs and convert to tokens
    const weeklyEmission = Number(fromNano(emission)) * BLOCKS_PER_WEEK;

    // Calculate ratios
    const percIncentivesRatio = Number(incentivesRatio) / 100;
    const percComputedWeight = computedWeightedAgents.percComputedWeight;

    // Emission * %Incentive * %Agent Weight * (1 - Penalty Factor)
    return (
      weeklyEmission *
      percIncentivesRatio *
      percComputedWeight *
      (1 - weightPenaltyFactor / 100)
    );
  }, [
    emission,
    incentivesRatio,
    computedWeightedAgents?.percComputedWeight,
    computedWeightedAgents?.computedWeight,
    agent.weightFactor,
  ]);

  // Calculate USD value of weekly tokens
  const usdValue = useMemo(() => {
    if (!torusPrice) return "-";
    const calculatedValue = tokensPerWeek * Number(torusPrice);
    return `$${calculatedValue.toFixed(2)}`;
  }, [tokensPerWeek, torusPrice]);

  return {
    tokensPerWeek,
    usdValue,
    isLoading,
    isError,
  };
}
