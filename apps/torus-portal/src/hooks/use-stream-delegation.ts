"use client";

import type { SS58Address } from "@torus-network/sdk/types";
import type { Nullish } from "@torus-network/torus-utils";

import { api } from "~/trpc/react";

/**
 * Hook to fetch all stream delegations from the view
 */
export function useStreamDelegations() {
  return api.permission.streamDelegations.useQuery();
}

/**
 * Hook to fetch stream delegations for a specific agent
 */
export function useStreamDelegationsByAgent(agentKey: SS58Address | Nullish) {
  return api.permission.streamDelegationsByAgent.useQuery(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    { agentKey: agentKey! },
    { enabled: !!agentKey },
  );
}

/**
 * Hook to fetch stream delegations for a specific stream ID
 */
export function useStreamDelegationsByStreamId(streamId: string | Nullish) {
  return api.permission.streamDelegationsByStreamId.useQuery(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    { streamId: streamId! },
    { enabled: !!streamId && streamId.length === 66 },
  );
}

/**
 * Hook to fetch stream delegations by root grantor
 */
export function useStreamDelegationsByRootGrantor(
  rootGrantor: SS58Address | Nullish,
) {
  return api.permission.streamDelegationsByRootGrantor.useQuery(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    { rootGrantor: rootGrantor! },
    { enabled: !!rootGrantor },
  );
}
