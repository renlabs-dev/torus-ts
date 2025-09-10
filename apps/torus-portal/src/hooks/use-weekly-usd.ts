import type { TorAmount } from "@torus-network/torus-utils/torus/token";
import { makeTorAmount } from "@torus-network/torus-utils/torus/token";
import { useGetTorusPrice } from "@torus-ts/query-provider/hooks";
import { api as extAPI } from "~/trpc/react";
// useMemo removed - using direct calculations now
import {
  calculateAgentTokensPerWeek,
  useTokensPerWeek,
} from "./use-tokens-per-week";

interface AgentUsdCalculationResult {
  isLoading: boolean;
  isError: boolean;
  tokensPerWeek: TorAmount;
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

  // Use the new tokens per week hook
  const {
    isLoading: isTokensPerWeekLoading,
    isError: isTokensPerWeekError,
    effectiveEmissionAmount,
    incentivesRatioValue,
  } = useTokensPerWeek();

  // Loads all queries at once, and if any of them are wrong, the whole result is wrong
  const isLoading =
    isTorusPriceLoading ||
    isComputedWeightLoading ||
    isTokensPerWeekLoading ||
    computedWeightedAgents === undefined;

  const isError =
    isTorusPriceError || isComputedWeightError || isTokensPerWeekError;

  // Calculate tokens per week
  const tokensPerWeek = (() => {
    // Early return conditions
    if (isLoading || isError || computedWeightedAgents === null)
      return makeTorAmount(0);

    const weightPenaltyValue = props.weightFactor ?? 1;
    const agentWeightValue = computedWeightedAgents.percComputedWeight * 100;

    return calculateAgentTokensPerWeek(
      effectiveEmissionAmount,
      incentivesRatioValue,
      agentWeightValue,
      weightPenaltyValue,
    );
  })();

  // Calculate USD value of weekly tokens
  const usdValue = (() => {
    if (isLoading || isError || !torusPrice) return 0;
    return tokensPerWeek.toNumber() * torusPrice;
  })();

  // EXAMPLE: 5000000.00000 will be displayed: 5,000,000.00 TORUS
  const displayTokensPerWeek = (() => {
    if (isLoading || isError) return "0.00 TORUS";
    return (
      tokensPerWeek.toNumber().toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + " TORUS"
    );
  })();

  // EXAMPLE: 50000.0000 will be displayed: $50,000.00
  const displayUsdValue = (() => {
    if (isLoading || isError) return "$0.00";
    return usdValue.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  })();

  return {
    tokensPerWeek,
    usdValue,
    isLoading,
    isError,
    displayTokensPerWeek,
    displayUsdValue,
  };
}
