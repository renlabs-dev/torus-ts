import type { TorAmount } from "@torus-network/torus-utils/torus/token";
import {
  formatTorusToken,
  makeTorAmount,
} from "@torus-network/torus-utils/torus/token";
import { api } from "~/trpc/react";
import { useMemo } from "react";
import { useMultipleAccountStreams } from "./use-multiple-account-streams";
import { useTokensPerWeek } from "./use-tokens-per-week";

export interface AccountEmissionData {
  isLoading: boolean;
  isError: boolean;
  root: {
    tokensPerWeek: TorAmount;
    percentage: number;
  };
  streams: {
    incoming: {
      tokensPerWeek: TorAmount;
      percentage: number;
      count: number;
    };
    outgoing: {
      tokensPerWeek: TorAmount;
      percentage: number;
      count: number;
    };
    net: {
      tokensPerWeek: TorAmount;
      percentage: number;
    };
  };
  total: {
    tokensPerWeek: TorAmount;
    percentage: number;
  };
  totalWithoutOutgoing: {
    tokensPerWeek: TorAmount;
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
        const zeroAmount = makeTorAmount(0);
        result[accountId] = {
          isLoading,
          isError,
          root: { tokensPerWeek: zeroAmount, percentage: 0 },
          streams: {
            incoming: { tokensPerWeek: zeroAmount, percentage: 0, count: 0 },
            outgoing: { tokensPerWeek: zeroAmount, percentage: 0, count: 0 },
            net: { tokensPerWeek: zeroAmount, percentage: 0 },
          },
          total: { tokensPerWeek: zeroAmount, percentage: 0 },
          totalWithoutOutgoing: { tokensPerWeek: zeroAmount, percentage: 0 },
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
        const zeroAmount = makeTorAmount(0);
        result[accountId] = {
          isLoading: false,
          isError: false,
          root: { tokensPerWeek: zeroAmount, percentage: 0 },
          streams: {
            incoming: { tokensPerWeek: zeroAmount, percentage: 0, count: 0 },
            outgoing: { tokensPerWeek: zeroAmount, percentage: 0, count: 0 },
            net: { tokensPerWeek: zeroAmount, percentage: 0 },
          },
          total: { tokensPerWeek: zeroAmount, percentage: 0 },
          totalWithoutOutgoing: { tokensPerWeek: zeroAmount, percentage: 0 },
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
      const agentWeightValue = agentRootEmissions?.percComputedWeight
        ? agentRootEmissions.percComputedWeight * 100
        : 0;
      const rootTokensPerWeek =
        agentWeightValue > 0
          ? tokensPerWeek.baseWeeklyTokens
              .multipliedBy(makeTorAmount(agentWeightValue / 100))
              .multipliedBy(makeTorAmount(1 - weightPenaltyValue / 100))
          : makeTorAmount(0);

      // Get stream values
      const incomingTokensPerWeek = streamData.incoming.totalTokensPerWeek;
      const outgoingTokensPerWeek = streamData.outgoing.totalTokensPerWeek;

      const netStreamsTokensPerWeek = incomingTokensPerWeek.minus(
        outgoingTokensPerWeek,
      );

      // Calculate totals
      const totalEmission = rootTokensPerWeek.plus(netStreamsTokensPerWeek);
      const totalWithoutOutgoing = rootTokensPerWeek.plus(
        incomingTokensPerWeek,
      );

      // Calculate percentages relative to base weekly tokens
      const baseWeekly = tokensPerWeek.baseWeeklyTokens.isZero()
        ? makeTorAmount(1)
        : tokensPerWeek.baseWeeklyTokens;

      const root = {
        tokensPerWeek: rootTokensPerWeek,
        percentage: rootTokensPerWeek
          .dividedBy(baseWeekly)
          .multipliedBy(makeTorAmount(100))
          .toNumber(),
      };

      const streams = {
        incoming: {
          tokensPerWeek: incomingTokensPerWeek,
          percentage: incomingTokensPerWeek
            .dividedBy(baseWeekly)
            .multipliedBy(makeTorAmount(100))
            .toNumber(),
          count: streamData.incoming.streams.length,
        },
        outgoing: {
          tokensPerWeek: outgoingTokensPerWeek,
          percentage: outgoingTokensPerWeek
            .dividedBy(baseWeekly)
            .multipliedBy(makeTorAmount(100))
            .toNumber(),
          count: streamData.outgoing.streams.length,
        },
        net: {
          tokensPerWeek: netStreamsTokensPerWeek,
          percentage: netStreamsTokensPerWeek
            .dividedBy(baseWeekly)
            .multipliedBy(makeTorAmount(100))
            .toNumber(),
        },
      };

      const total = {
        tokensPerWeek: totalEmission,
        percentage: totalEmission
          .dividedBy(baseWeekly)
          .multipliedBy(makeTorAmount(100))
          .toNumber(),
      };

      const totalWithoutOutgoingData = {
        tokensPerWeek: totalWithoutOutgoing,
        percentage: totalWithoutOutgoing
          .dividedBy(baseWeekly)
          .multipliedBy(makeTorAmount(100))
          .toNumber(),
      };

      // Format display values
      const formatTokens = (value: TorAmount) => {
        return formatTorusToken(value, 2) + " TORUS";
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
