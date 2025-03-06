import {
  useGetTorusPrice,
  // useBlockEmission,
  // useIncentivesRatio,
} from "@torus-ts/query-provider/hooks";
import { CONSTANTS } from "@torus-ts/subspace";
import { useMemo } from "react";
import { api as extAPI } from "~/trpc/react";
import type { Agent } from "~/utils/types";

interface AgentUsdCalculationResult {
  isLoading: boolean;
  isError: boolean;
  tokensPerWeek: number;
  usdValue: number;
  displayTokensPerWeek: string;
  displayUsdValue: string;
}

export function useWeeklyUsdCalculation(
  agent: Agent,
): AgentUsdCalculationResult {
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
  const isLoading = isTorusPriceLoading || isComputedWeightLoading;
  const isError = isTorusPriceError || isComputedWeightError;

  // Calculate tokens per week
  const tokensPerWeek = useMemo(() => {
    if (!computedWeightedAgents?.computedWeight) return 0;

    // Blocks per week calculation
    const BLOCKS_PER_WEEK =
      CONSTANTS.TIME.ONE_WEEK / CONSTANTS.TIME.BLOCK_TIME_SECONDS;

    // Weight Factor is the penalty factor
    const weightPenaltyFactor = agent.weightFactor ?? 1; // Default to 1 if not available

    // Calculate weekly emission in NANOs and convert to tokens
    const weeklyEmission = CONSTANTS.EMISSION.BLOCK_EMISSION * BLOCKS_PER_WEEK;

    // Computed Weight but the percentage
    const percComputedWeight = computedWeightedAgents.percComputedWeight;

    // Emission * %Incentive * %Agent Weight * (1 - Penalty Factor)
    return (
      weeklyEmission *
      CONSTANTS.ECONOMY.DEFAULT_INCENTIVES_RATIO *
      percComputedWeight *
      (1 - weightPenaltyFactor)
    );
  }, [
    computedWeightedAgents?.percComputedWeight,
    computedWeightedAgents?.computedWeight,
    agent.weightFactor,
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
