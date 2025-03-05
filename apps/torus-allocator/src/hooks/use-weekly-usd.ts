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
  const { data: emission } = useBlockEmission(api);
  const { data: incentivesRatio } = useIncentivesRatio(api);
  const { data: torusPrice } = useGetTorusPrice();

  // Get the agent weight with the agent key
  const { data: computedWeightedAgents } =
    extAPI.computedAgentWeight.byAgentKey.useQuery({ agentKey: agent.key });

  // Calculate tokens per week
  const tokensPerWeek = useMemo(() => {
    if (
      !emission ||
      !incentivesRatio ||
      !computedWeightedAgents?.computedWeight
    )
      return 0;

    // Calculations
    // 525600(1 Week in seconds) / 8 (Average block time) = 75600(Blocks)
    const BLOCKS_PER_WEEK = ONE_WEEK / BLOCK_TIME_SECONDS;

    // Get weight penalty factor
    const weightPenaltyFactor = agent.weightFactor ?? 1; // Default to 1 if not available

    // Calculate weekly emission in NANOs
    const weeklyEmissionNanos = emission * BigInt(BLOCKS_PER_WEEK);

    // Convert to standard units using fromNano utility
    const weeklyEmissionTokens = Number(fromNano(weeklyEmissionNanos));

    // Incentives Ratio are from 1 to 100, gotta divide to 100
    const percIncentivesRatio = Number(incentivesRatio) / 100;

    // Percent Computed Weight
    const percComputedWeight = computedWeightedAgents.percComputedWeight;

    // Emission * %Incentive * %Agent Weight * (1 - Penalty Factor)
    return (
      weeklyEmissionTokens *
      percIncentivesRatio *
      percComputedWeight *
      (1 - weightPenaltyFactor)
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
    if (!torusPrice || tokensPerWeek === 0) return "Loading";
    const usdValue = tokensPerWeek * Number(torusPrice);
    return `$${usdValue.toFixed(2)}`;
  }, [tokensPerWeek, torusPrice]);

  return {
    tokensPerWeek,
    usdValue,
    isLoading: false,
    isError: false,
  };
}
