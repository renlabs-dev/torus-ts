"use client";

import { useQuery } from "@tanstack/react-query";
import type { Api, SS58Address, StreamId } from "@torus-network/sdk";
import {
  buildAvailableStreamsFor,
  queryAccumulatedStreamsForAccount,
  queryPermissions,
} from "@torus-network/sdk";
import type { Nullish } from "@torus-network/torus-utils";
import { assert } from "tsafe";

import { chainErr } from "@torus-network/torus-utils/error";

interface AvailableStream {
  streamId: StreamId;
  amount: bigint;
  isRootStream: boolean;
}

async function fetchAvailableStreamsForAgent(
  api: Api,
  agentId: SS58Address,
): Promise<AvailableStream[]> {
  // Query all permissions
  const [permissionsErr, permissions] = await queryPermissions(api);
  if (permissionsErr !== undefined) {
    throw chainErr("Failed to query permissions")(permissionsErr);
  }

  // Query accumulated streams for the agent
  const [accErr, accumulatedStreams] = await queryAccumulatedStreamsForAccount(
    api,
    agentId,
  );
  if (accErr !== undefined) {
    throw chainErr("Failed to query accumulated streams")(accErr);
  }

  // Use buildAvailableStreamsFor to get available streams
  const availableStreams = buildAvailableStreamsFor(agentId, {
    permissions,
    accumulatedStreams,
  });

  // Sort streams by amount
  const sortedStreams = Array.from(availableStreams.streamsMap.entries()).sort(
    (a, b) => Number(b[1] - a[1]), // Sort descending by amount
  );

  // Check if the agent's root stream is present
  const hasRootStream = sortedStreams.some(
    ([streamId]) => streamId === availableStreams.agentRootStreamId,
  );

  // If not, add it to the end with 0 amount
  const streams = !hasRootStream
    ? [...sortedStreams, [availableStreams.agentRootStreamId, 0n] as const]
    : sortedStreams;

  return streams.map(([streamId, amount]) => ({
    streamId,
    amount,
    isRootStream: streamId === availableStreams.agentRootStreamId,
  }));
}

export function useAvailableStreams(
  api: Api | Nullish,
  agentId: SS58Address | Nullish,
) {
  return useQuery({
    queryKey: ["available-streams", agentId],
    enabled: !!api && !!agentId,
    queryFn: () => {
      assert(api != null, "api arg is required");
      assert(agentId != null, "agentId arg is required");
      return fetchAvailableStreamsForAgent(api, agentId);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}
