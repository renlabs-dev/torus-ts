import { env } from "~/env";
import { api as trpcApi } from "~/trpc/react";

import { createSimplifiedGraphData } from "./force-graph-utils";

export function useGraphData() {
  const allocatorAddress = env("NEXT_PUBLIC_TORUS_ALLOCATOR_ADDRESS");

  const cacheOptions = {
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 1,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    refetchInterval: false as const,
  };

  const { data: allPermissions, isLoading: isLoadingPermissions } =
    trpcApi.permission.allWithCompletePermissions.useQuery(
      undefined,
      cacheOptions,
    );

  const { data: allAgentsData, isLoading: isLoadingAgents } =
    trpcApi.agent.allIncludingNonWhitelisted.useQuery(undefined, cacheOptions);

  const { data: allComputedWeights, isLoading: isLoadingWeights } =
    trpcApi.computedAgentWeight.all.useQuery(undefined, cacheOptions);

  const { data: allSignals, isLoading: isLoadingSignals } =
    trpcApi.signal.all.useQuery(undefined, cacheOptions);

  const graphData = (() => {
    if (
      isLoadingAgents ||
      isLoadingPermissions ||
      !allAgentsData ||
      !allPermissions
    ) {
      return null;
    }

    const allAgents = allAgentsData.filter((agent) => agent.isWhitelisted);

    return createSimplifiedGraphData(
      allAgents,
      allPermissions,
      allocatorAddress,
      allSignals,
      allAgentsData,
    );
  })();

  const isLoading =
    isLoadingPermissions ||
    isLoadingAgents ||
    isLoadingWeights ||
    isLoadingSignals;

  return {
    isLoading,

    graphData,
    allocatorAddress,

    allSignals,
    allPermissions,
    allComputedWeights,
  };
}
