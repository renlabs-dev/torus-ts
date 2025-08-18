import { useMemo } from "react";

import { api } from "~/trpc/react";

import { useAccountStreamsSummary } from "./use-account-streams";
import {
  calculateAgentTokensPerWeek,
  useTokensPerWeek,
} from "./use-tokens-per-week";

interface UseAccountEmissionsProps {
  accountId: string;
  weightFactor?: number;
}

interface EmissionBreakdown {
  root: {
    tokensPerWeek: number;
    percentage: number;
  };
  streams: {
    incoming: {
      tokensPerWeek: number;
      percentage: number;
      count: number;
    };
    outgoing: {
      tokensPerWeek: number;
      percentage: number;
      count: number;
    };
    net: {
      tokensPerWeek: number;
      percentage: number;
    };
  };
  total: {
    tokensPerWeek: number;
    percentage: number;
  };
}

interface AccountEmissionsResult {
  isLoading: boolean;
  isError: boolean;
  emissions: EmissionBreakdown;
  agentNetworkEmission: number;
  displayValues: {
    agentNetworkEmission: string;
    rootEmission: string;
    incomingStreams: string;
    outgoingStreams: string;
    netStreams: string;
  };
  hasCalculatingStreams: boolean;
}

export function useAccountEmissions(
  props: UseAccountEmissionsProps,
): AccountEmissionsResult {
  const tokensPerWeek = useTokensPerWeek();

  const { data: agentRootEmissions, isLoading: isAgentLoading } =
    api.computedAgentWeight.byAgentKey.useQuery(
      { agentKey: props.accountId },
      {
        refetchOnWindowFocus: false,
        refetchOnMount: false,
      },
    );

  const userStreamsSummary = useAccountStreamsSummary({
    accountId: props.accountId,
  });

  const result = useMemo<AccountEmissionsResult>(() => {
    const isLoading =
      tokensPerWeek.isLoading || isAgentLoading || userStreamsSummary.isLoading;
    const isError = tokensPerWeek.isError || userStreamsSummary.isError;

    if (isLoading || isError || !agentRootEmissions) {
      return {
        isLoading,
        isError,
        emissions: {
          root: { tokensPerWeek: 0, percentage: 0 },
          streams: {
            incoming: { tokensPerWeek: 0, percentage: 0, count: 0 },
            outgoing: { tokensPerWeek: 0, percentage: 0, count: 0 },
            net: { tokensPerWeek: 0, percentage: 0 },
          },
          total: { tokensPerWeek: 0, percentage: 0 },
        },
        agentNetworkEmission: 0,
        displayValues: {
          agentNetworkEmission: "0.00 TORUS",
          rootEmission: "0.00 TORUS",
          incomingStreams: "0.00 TORUS",
          outgoingStreams: "0.00 TORUS",
          netStreams: "0.00 TORUS",
        },
        hasCalculatingStreams: false,
      };
    }

    // Calculate root emission
    const weightPenaltyValue = props.weightFactor ?? 1;
    const agentWeightValue = agentRootEmissions.percComputedWeight * 100;
    const rootTokensPerWeek = calculateAgentTokensPerWeek(
      tokensPerWeek.effectiveEmissionAmount,
      tokensPerWeek.incentivesRatioValue,
      agentWeightValue,
      weightPenaltyValue,
    );

    // Get stream values
    const incomingTokensPerWeek =
      userStreamsSummary.incoming.totalTokensPerWeek;
    const outgoingTokensPerWeek =
      userStreamsSummary.outgoing.totalTokensPerWeek;
    const netStreamsTokensPerWeek =
      incomingTokensPerWeek - outgoingTokensPerWeek;

    // Calculate total agent network emission
    const agentNetworkEmission = rootTokensPerWeek + netStreamsTokensPerWeek;

    // Calculate percentages relative to base weekly tokens
    const baseWeekly = tokensPerWeek.baseWeeklyTokens || 1; // Prevent division by zero

    const emissions: EmissionBreakdown = {
      root: {
        tokensPerWeek: rootTokensPerWeek,
        percentage: (rootTokensPerWeek / baseWeekly) * 100,
      },
      streams: {
        incoming: {
          tokensPerWeek: incomingTokensPerWeek,
          percentage: (incomingTokensPerWeek / baseWeekly) * 100,
          count: userStreamsSummary.incoming.streams.length,
        },
        outgoing: {
          tokensPerWeek: outgoingTokensPerWeek,
          percentage: (outgoingTokensPerWeek / baseWeekly) * 100,
          count: userStreamsSummary.outgoing.streams.length,
        },
        net: {
          tokensPerWeek: netStreamsTokensPerWeek,
          percentage: (netStreamsTokensPerWeek / baseWeekly) * 100,
        },
      },
      total: {
        tokensPerWeek: agentNetworkEmission,
        percentage: (agentNetworkEmission / baseWeekly) * 100,
      },
    };

    // Format display values
    const formatTokens = (value: number) => {
      return (
        value.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }) + " TORUS"
      );
    };

    const displayValues = {
      agentNetworkEmission: formatTokens(agentNetworkEmission),
      rootEmission: formatTokens(rootTokensPerWeek),
      incomingStreams: formatTokens(incomingTokensPerWeek),
      outgoingStreams: formatTokens(outgoingTokensPerWeek),
      netStreams: formatTokens(netStreamsTokensPerWeek),
    };

    return {
      isLoading,
      isError,
      emissions,
      agentNetworkEmission,
      displayValues,
      hasCalculatingStreams: userStreamsSummary.hasAnyCalculating,
    };
  }, [
    tokensPerWeek,
    agentRootEmissions,
    userStreamsSummary,
    isAgentLoading,
    props.weightFactor,
  ]);

  return result;
}
