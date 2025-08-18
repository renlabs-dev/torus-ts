import { useMemo } from "react";

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

  const { data: allAgents, isLoading: isLoadingAgents } =
    trpcApi.agent.all.useQuery(undefined, cacheOptions);

  const { data: allComputedWeights, isLoading: isLoadingWeights } =
    trpcApi.computedAgentWeight.all.useQuery(undefined, cacheOptions);

  const { data: allSignals, isLoading: isLoadingSignals } =
    trpcApi.signal.all.useQuery(undefined, cacheOptions);

  const graphData = useMemo(() => {
    // Wait for all data to be loaded before calling the function
    if (
      isLoadingAgents ||
      isLoadingPermissions ||
      !allAgents ||
      !allPermissions
    ) {
      return null;
    }

    // Only call the function when we have complete data
    return createSimplifiedGraphData(
      allAgents,
      allPermissions,
      allocatorAddress,
      allSignals,
    );
  }, [
    allAgents,
    allPermissions,
    allocatorAddress,
    allSignals,
    isLoadingAgents,
    isLoadingPermissions,
  ]);

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
