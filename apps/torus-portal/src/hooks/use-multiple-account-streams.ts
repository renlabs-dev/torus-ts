import { CONSTANTS } from "@torus-network/sdk/constants";
import type {
  RemAmount,
  TorAmount,
} from "@torus-network/torus-utils/torus/token";
import {
  fromRems,
  makeTorAmount,
} from "@torus-network/torus-utils/torus/token";
import { api } from "~/trpc/react";
import { useMemo } from "react";

interface StreamData {
  permissionId: string;
  streamId: string;
  tokensPerBlock: TorAmount;
  tokensPerWeek: TorAmount;
  percentage: number;
}

interface StreamSummary {
  totalTokensPerBlock: TorAmount;
  totalTokensPerWeek: TorAmount;
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
  hasAnyCalculating: boolean;
}

interface UseMultipleAccountStreamsProps {
  accountIds: string[];
  lastN?: number;
}

const BLOCKS_PER_WEEK =
  CONSTANTS.TIME.ONE_WEEK / CONSTANTS.TIME.BLOCK_TIME_SECONDS;

function processStreamData(
  streams: Record<string, Record<string, RemAmount | null>>,
): StreamSummary {
  const streamList: StreamData[] = [];
  let totalTokensPerBlock = makeTorAmount(0);
  let hasNullValues = false;
  let hasValidValues = false;

  for (const [permissionId, streamData] of Object.entries(streams)) {
    for (const [streamId, tokensPerBlockRaw] of Object.entries(streamData)) {
      if (tokensPerBlockRaw === null) {
        hasNullValues = true;
      } else {
        hasValidValues = true;
        const tokensPerBlock = fromRems(tokensPerBlockRaw);
        const tokensPerWeek = tokensPerBlock.multipliedBy(
          makeTorAmount(BLOCKS_PER_WEEK),
        );

        streamList.push({
          permissionId,
          streamId,
          tokensPerBlock,
          tokensPerWeek,
          percentage: 0, // Will be calculated after totals
        });

        totalTokensPerBlock = totalTokensPerBlock.plus(tokensPerBlock);
      }
    }
  }

  // Calculate percentages based on total
  const processedStreams = streamList.map((stream) => ({
    ...stream,
    percentage: totalTokensPerBlock.isGreaterThan(makeTorAmount(0))
      ? stream.tokensPerBlock
          .dividedBy(totalTokensPerBlock)
          .multipliedBy(makeTorAmount(100))
          .toNumber()
      : 0,
  }));
  const totalTokensPerWeek = totalTokensPerBlock.multipliedBy(
    makeTorAmount(BLOCKS_PER_WEEK),
  );
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

export function useMultipleAccountStreams(
  props: UseMultipleAccountStreamsProps,
): Record<string, AccountStreamsResult> {
  const { data, isLoading, isError } =
    api.permission.streamsByMultipleAccountsPerBlock.useQuery(
      {
        accountIds: props.accountIds,
        lastN: props.lastN ?? 7,
      },
      {
        enabled: props.accountIds.length > 0,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
      },
    );

  return useMemo(() => {
    const result: Record<string, AccountStreamsResult> = {};

    for (const accountId of props.accountIds) {
      const accountData = data?.[accountId];

      if (!accountData) {
        const zeroAmount = makeTorAmount(0);
        result[accountId] = {
          incoming: {
            totalTokensPerBlock: zeroAmount,
            totalTokensPerWeek: zeroAmount,
            totalPercentage: 0,
            streams: [],
            isCalculating: false,
            hasPartialData: false,
          },
          outgoing: {
            totalTokensPerBlock: zeroAmount,
            totalTokensPerWeek: zeroAmount,
            totalPercentage: 0,
            streams: [],
            isCalculating: false,
            hasPartialData: false,
          },
          isLoading,
          isError,
          hasAnyCalculating: false,
        };
        continue;
      }

      const incoming = processStreamData(accountData.incoming);
      const outgoing = processStreamData(accountData.outgoing);

      const hasAnyCalculating =
        incoming.isCalculating ||
        outgoing.isCalculating ||
        incoming.hasPartialData ||
        outgoing.hasPartialData;

      result[accountId] = {
        incoming,
        outgoing,
        isLoading,
        isError,
        hasAnyCalculating,
      };
    }

    return result;
  }, [data, isLoading, isError, props.accountIds]);
}
