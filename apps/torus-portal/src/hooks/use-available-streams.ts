"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiPromise, WsProvider } from "@polkadot/api";
import {
  generateRootStreamId,
  queryAccumulatedStreamsForAccount,
} from "@torus-network/sdk";
import type { StreamId } from "@torus-network/sdk";
import type { SS58Address } from "@torus-network/sdk";

const NODE_URL = "wss://api.testnet.torus.network";

interface AvailableStream {
  streamId: StreamId;
  amount: bigint;
  isRootStream: boolean;
}

async function connectToChainRpc(wsEndpoint: string) {
  const wsProvider = new WsProvider(wsEndpoint);
  const api = await ApiPromise.create({ provider: wsProvider });
  if (!api.isConnected) {
    throw new Error("API not connected");
  }
  return api;
}

async function fetchAvailableStreamsForAgent(
  agentId: SS58Address,
): Promise<AvailableStream[]> {
  const api = await connectToChainRpc(NODE_URL);

  try {
    const agentRootStreamId = generateRootStreamId(agentId);

    const [qErr, baseStreamsMap] = await queryAccumulatedStreamsForAccount(
      api,
      agentId,
    );

    if (qErr !== undefined) {
      throw new Error(`Failed to query streams: ${qErr.message}`);
    }

    const streamsTotalMap = new Map<StreamId, bigint>();
    for (const [streamId, permToAmountMap] of baseStreamsMap) {
      for (const [_permId, amount] of permToAmountMap) {
        const cur = streamsTotalMap.get(streamId) ?? 0n;
        streamsTotalMap.set(streamId, cur + amount);
      }
    }

    const sortedStreams = Array.from(streamsTotalMap.entries()).sort((a, b) =>
      Number(a[1] - b[1]),
    );

    // Check if one of the streams is the agent's root stream
    const hasRootStream = sortedStreams.some(
      ([streamId]) => streamId === agentRootStreamId,
    );

    // If not, add it to the beginning with 0 amount
    if (!hasRootStream) {
      sortedStreams.unshift([agentRootStreamId, 0n]);
    }

    return sortedStreams.map(([streamId, amount]) => ({
      streamId,
      amount,
      isRootStream: streamId === agentRootStreamId,
    }));
  } finally {
    await api.disconnect();
  }
}

export function useAvailableStreams(agentId?: SS58Address) {
  return useQuery({
    queryKey: ["available-streams", agentId],
    queryFn: () => {
      if (!agentId) {
        throw new Error("Agent ID is required");
      }
      return fetchAvailableStreamsForAgent(agentId);
    },
    enabled: !!agentId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}
