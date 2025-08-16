import { useMemo } from "react";

import { CONSTANTS } from "@torus-network/sdk/constants";

import { api } from "~/trpc/react";

interface StreamData {
  permissionId: string;
  streamId: string;
  tokensPerBlock: number;
  tokensPerWeek: number;
  percentage: number;
}

interface StreamSummary {
  totalTokensPerBlock: number;
  totalTokensPerWeek: number;
  totalPercentage: number;
  streams: StreamData[];
  isCalculating: boolean;
  hasPartialData: boolean;
}

interface AccountStreamsResult {
  incoming: StreamSummary;
  outgoing: StreamSummary;
  isLoading: boolean;
  isError: boolean;
}

interface UseAccountStreamsProps {
  accountId: string;
  lastN?: number;
}

const BLOCKS_PER_WEEK =
  CONSTANTS.TIME.ONE_WEEK / CONSTANTS.TIME.BLOCK_TIME_SECONDS;

function processStreamData(
  streams: Record<string, Record<string, number | null>>,
  // type: "incoming" | "outgoing",
): StreamSummary {
  const streamList: StreamData[] = [];
  let totalTokensPerBlock = 0;
  let hasNullValues = false;
  let hasValidValues = false;

  for (const [permissionId, streamData] of Object.entries(streams)) {
    for (const [streamId, tokensPerBlockRaw] of Object.entries(streamData)) {
      if (tokensPerBlockRaw === null) {
        hasNullValues = true;
      } else {
        hasValidValues = true;

        const tokensPerBlock = tokensPerBlockRaw / 10e18;
        const tokensPerWeek = tokensPerBlock * BLOCKS_PER_WEEK;

        streamList.push({
          permissionId,
          streamId,
          tokensPerBlock,
          tokensPerWeek,
          percentage: 0, // Will be calculated after totals
        });

        totalTokensPerBlock += tokensPerBlock;
      }
    }
  }

  // Calculate percentages based on total
  const processedStreams = streamList.map((stream) => ({
    ...stream,
    percentage:
      totalTokensPerBlock > 0
        ? (stream.tokensPerBlock / totalTokensPerBlock) * 100
        : 0,
  }));

  const totalTokensPerWeek = totalTokensPerBlock * BLOCKS_PER_WEEK;
  const totalPercentage = processedStreams.reduce(
    (sum, s) => sum + s.percentage,
    0,
  );

  return {
    totalTokensPerBlock,
    totalTokensPerWeek,
    totalPercentage,
    streams: processedStreams,
    isCalculating: hasNullValues && !hasValidValues, // All streams still calculating
    hasPartialData: hasNullValues && hasValidValues, // Some streams calculating, some ready
  };
}

export function useAccountStreams(
  props: UseAccountStreamsProps,
): AccountStreamsResult {
  const { data, isLoading, isError } =
    api.permission.streamsByAccountPerBlock.useQuery(
      {
        accountId: props.accountId,
        lastN: props.lastN ?? 7,
      },
      {
        refetchOnWindowFocus: false,
        refetchOnMount: false,
      },
    );

  const result = useMemo<AccountStreamsResult>(() => {
    if (!data) {
      return {
        incoming: {
          totalTokensPerBlock: 0,
          totalTokensPerWeek: 0,
          totalPercentage: 0,
          streams: [],
          isCalculating: false,
          hasPartialData: false,
        },
        outgoing: {
          totalTokensPerBlock: 0,
          totalTokensPerWeek: 0,
          totalPercentage: 0,
          streams: [],
          isCalculating: false,
          hasPartialData: false,
        },
        isLoading,
        isError,
      };
    }

    const incoming = processStreamData(data.incoming);
    const outgoing = processStreamData(data.outgoing);

    return {
      incoming,
      outgoing,
      isLoading,
      isError,
    };
  }, [data, isLoading, isError]);

  return result;
}

export function useAccountStreamsSummary(props: UseAccountStreamsProps) {
  const streams = useAccountStreams(props);

  return useMemo(() => {
    const delta =
      streams.incoming.totalTokensPerBlock -
      streams.outgoing.totalTokensPerBlock;
    const deltaTokensPerWeek =
      streams.incoming.totalTokensPerWeek - streams.outgoing.totalTokensPerWeek;

    const isFullyCalculated =
      !streams.incoming.isCalculating &&
      !streams.outgoing.isCalculating &&
      !streams.incoming.hasPartialData &&
      !streams.outgoing.hasPartialData;

    return {
      ...streams,
      delta: {
        tokensPerBlock: delta,
        tokensPerWeek: deltaTokensPerWeek,
        isPositive: delta > 0,
      },
      isFullyCalculated,
      hasAnyCalculating:
        streams.incoming.isCalculating ||
        streams.outgoing.isCalculating ||
        streams.incoming.hasPartialData ||
        streams.outgoing.hasPartialData,
    };
  }, [streams]);
}
