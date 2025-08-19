import { useMemo } from "react";

import { api } from "~/trpc/react";

import { useMultipleAccountStreams } from "./use-multiple-account-streams";
import {
  calculateAgentTokensPerWeek,
  useTokensPerWeek,
} from "./use-tokens-per-week";

export interface AccountEmissionData {
  isLoading: boolean;
  isError: boolean;
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
  totalWithoutOutgoing: {
    tokensPerWeek: number;
    percentage: number;
  };
  displayValues: {
    totalWithoutOutgoing: string;
    totalEmission: string;
    rootEmission: string;
    incomingStreams: string;
    outgoingStreams: string;
    netStreams: string;
  };
  hasCalculatingStreams: boolean;
}

interface UseMultipleAccountEmissionsProps {
  accountIds: string[];
  weightFactors?: Record<string, number | null>;
}

export function useMultipleAccountEmissions(
  props: UseMultipleAccountEmissionsProps,
): Record<string, AccountEmissionData> {
  const tokensPerWeek = useTokensPerWeek();

  // Batch query for all agent weights
  const { data: agentWeightsList, isLoading: isAgentWeightsLoading } =
    api.computedAgentWeight.byAgentKeys.useQuery(
      { agentKeys: props.accountIds },
      {
        enabled: props.accountIds.length > 0,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
      },
    );

  // Convert list to map for easier access
  const agentWeightsMap = useMemo(() => {
    if (!agentWeightsList) return {};
    const map: Record<string, { percComputedWeight: number }> = {};
    for (const agent of agentWeightsList) {
      map[agent.agentKey] = { percComputedWeight: agent.percComputedWeight };
    }
    return map;
  }, [agentWeightsList]);

  // Batch query for all account streams
  const batchStreamsData = useMultipleAccountStreams({
    accountIds: props.accountIds,
  });

  return useMemo(() => {
    const result: Record<string, AccountEmissionData> = {};

    for (const accountId of props.accountIds) {
      const agentRootEmissions = agentWeightsMap[accountId];
      const streamData = batchStreamsData[accountId];

      const isLoading =
        tokensPerWeek.isLoading ||
        isAgentWeightsLoading ||
        (streamData?.isLoading ?? true);
      const isError = tokensPerWeek.isError || (streamData?.isError ?? false);

      if (isLoading || isError) {
        result[accountId] = {
          isLoading,
          isError,
          root: { tokensPerWeek: 0, percentage: 0 },
          streams: {
            incoming: { tokensPerWeek: 0, percentage: 0, count: 0 },
            outgoing: { tokensPerWeek: 0, percentage: 0, count: 0 },
            net: { tokensPerWeek: 0, percentage: 0 },
          },
          total: { tokensPerWeek: 0, percentage: 0 },
          totalWithoutOutgoing: { tokensPerWeek: 0, percentage: 0 },
          displayValues: {
            totalWithoutOutgoing: "0.00 TORUS",
            totalEmission: "0.00 TORUS",
            rootEmission: "0.00 TORUS",
            incomingStreams: "0.00 TORUS",
            outgoingStreams: "0.00 TORUS",
            netStreams: "0.00 TORUS",
          },
          hasCalculatingStreams: false,
        };
        continue;
      }

      // Handle agents without stream data (shouldn't happen but defensive)
      if (!streamData) {
        result[accountId] = {
          isLoading: false,
          isError: false,
          root: { tokensPerWeek: 0, percentage: 0 },
          streams: {
            incoming: { tokensPerWeek: 0, percentage: 0, count: 0 },
            outgoing: { tokensPerWeek: 0, percentage: 0, count: 0 },
            net: { tokensPerWeek: 0, percentage: 0 },
          },
          total: { tokensPerWeek: 0, percentage: 0 },
          totalWithoutOutgoing: { tokensPerWeek: 0, percentage: 0 },
          displayValues: {
            totalWithoutOutgoing: "0.00 TORUS",
            totalEmission: "0.00 TORUS",
            rootEmission: "0.00 TORUS",
            incomingStreams: "0.00 TORUS",
            outgoingStreams: "0.00 TORUS",
            netStreams: "0.00 TORUS",
          },
          hasCalculatingStreams: false,
        };
        continue;
      }

      // Calculate root emission (0 for non-whitelisted agents)
      const weightPenaltyValue = props.weightFactors?.[accountId] ?? 1;
      const agentWeightValue = agentRootEmissions?.percComputedWeight ? agentRootEmissions.percComputedWeight * 100 : 0;
      const rootTokensPerWeek = agentWeightValue > 0 ? calculateAgentTokensPerWeek(
        tokensPerWeek.effectiveEmissionAmount,
        tokensPerWeek.incentivesRatioValue,
        agentWeightValue,
        weightPenaltyValue,
      ) : 0;

      // Get stream values
      const incomingTokensPerWeek = streamData.incoming.totalTokensPerWeek;
      const outgoingTokensPerWeek = streamData.outgoing.totalTokensPerWeek;
      const netStreamsTokensPerWeek =
        incomingTokensPerWeek - outgoingTokensPerWeek;

      // Calculate totals
      const totalEmission = rootTokensPerWeek + netStreamsTokensPerWeek;
      const totalWithoutOutgoing = rootTokensPerWeek + incomingTokensPerWeek;

      // Calculate percentages relative to base weekly tokens
      const baseWeekly = tokensPerWeek.baseWeeklyTokens || 1;

      const root = {
        tokensPerWeek: rootTokensPerWeek,
        percentage: (rootTokensPerWeek / baseWeekly) * 100,
      };

      const streams = {
        incoming: {
          tokensPerWeek: incomingTokensPerWeek,
          percentage: (incomingTokensPerWeek / baseWeekly) * 100,
          count: streamData.incoming.streams.length,
        },
        outgoing: {
          tokensPerWeek: outgoingTokensPerWeek,
          percentage: (outgoingTokensPerWeek / baseWeekly) * 100,
          count: streamData.outgoing.streams.length,
        },
        net: {
          tokensPerWeek: netStreamsTokensPerWeek,
          percentage: (netStreamsTokensPerWeek / baseWeekly) * 100,
        },
      };

      const total = {
        tokensPerWeek: totalEmission,
        percentage: (totalEmission / baseWeekly) * 100,
      };

      const totalWithoutOutgoingData = {
        tokensPerWeek: totalWithoutOutgoing,
        percentage: (totalWithoutOutgoing / baseWeekly) * 100,
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
        totalWithoutOutgoing: formatTokens(totalWithoutOutgoing),
        totalEmission: formatTokens(totalEmission),
        rootEmission: formatTokens(rootTokensPerWeek),
        incomingStreams: formatTokens(incomingTokensPerWeek),
        outgoingStreams: formatTokens(outgoingTokensPerWeek),
        netStreams: formatTokens(netStreamsTokensPerWeek),
      };

      result[accountId] = {
        isLoading,
        isError,
        root,
        streams,
        total,
        totalWithoutOutgoing: totalWithoutOutgoingData,
        displayValues,
        hasCalculatingStreams: streamData.hasAnyCalculating,
      };
    }

    return result;
  }, [
    tokensPerWeek,
    agentWeightsMap,
    isAgentWeightsLoading,
    batchStreamsData,
    props.weightFactors,
    props.accountIds,
  ]);
}
