"use client";

import { useBlockEmission, useGetTorusPrice, useIncentivesRatio } from "@torus-ts/query-provider/hooks";
import { useTorus } from "@torus-ts/torus-provider";
import { fromNano } from "@torus-ts/utils/subspace";
import { useMemo } from "react";
import { api as extAPI } from "~/trpc/react";
import type { Agent } from "~/utils/types";

interface AgentUsdCalculationResult {
  tokensPerWeek: number;
  usdValue: string;
}

export function useAgentUsdCalculation(agent: Agent): AgentUsdCalculationResult {
  const { api } = useTorus();
  const { data: emission } = useBlockEmission(api);
  const { data: incentivesRatio } = useIncentivesRatio(api);
  const { data: torusPrice } = useGetTorusPrice();

  // Get the agent weight with the agent key
  const { data: computedWeightedAgents } =
    extAPI.computedAgentWeight.byAgentKey.useQuery({ agentKey: agent.key });

  // Calculate tokens per week
  const tokensPerWeek = useMemo(() => {
    if (!emission || !incentivesRatio || !computedWeightedAgents?.computedWeight) return 0;
    
    // Constants - TODO MAKE A FILE ONLY FOR CONSTANTS
    // Calculations
    // 24(Hours) * 60(Minutes) = 1440(Minutes)
    // 1440(Minutes) * 60(Seconds) = 86400(Seconds)
    // 86400(Seconds) / 7(Days) = 525600(Seconds)
    // 525600(Seconds) / 8 (Average block time) = 75600(Blocks)
    const BLOCKS_PER_WEEK = 75600; // Approx. 7 days of blocks at 8 second block time
    
    // Get weight penalty factor
    const weightPenaltyFactor = agent.weightFactor ?? 1; // Default to 1 if not available
    
    // Calculate weekly emission in NANOs
    const weeklyEmissionNanos = emission * BigInt(BLOCKS_PER_WEEK);
    
    // Convert to standard units using fromNano utility
    const weeklyEmissionTokens = Number(fromNano(weeklyEmissionNanos));

    // Incentives Ratio are from 1 to 100, gotta divide to 100
    const percIncentivesRatio = Number(incentivesRatio)/100;

    // Percent Computed Weight
    const percComputedWeight = computedWeightedAgents?.percComputedWeight
    
    // Emission * Incentive % * Agent Weight - Penalty Factor
    return ((weeklyEmissionTokens * percIncentivesRatio) * percComputedWeight) * (1 - weightPenaltyFactor)
  }, [emission, incentivesRatio, computedWeightedAgents?.percComputedWeight, agent.weightFactor]);

  // Calculate USD value of weekly tokens
  const usdValue = useMemo(() => {
    if (!torusPrice || tokensPerWeek === 0) return "Loading";
    
    const usdValue = tokensPerWeek * torusPrice;
    return `$${usdValue.toFixed(2)}`;
  }, [tokensPerWeek, torusPrice]);

  return {
    tokensPerWeek,
    usdValue,
  };
}