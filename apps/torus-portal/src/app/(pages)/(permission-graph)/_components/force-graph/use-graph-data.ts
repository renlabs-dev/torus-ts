import { useMemo } from "react";

import { useLastBlock } from "@torus-ts/query-provider/hooks";
import { useTorus } from "@torus-ts/torus-provider";

import { env } from "~/env";
import { api as trpcApi } from "~/trpc/react";

import { createSimplifiedGraphData } from "./force-graph-utils";

export function useGraphData() {
  const { api } = useTorus();
  const lastBlock = useLastBlock(api);

  const allocatorAddress = env("NEXT_PUBLIC_TORUS_ALLOCATOR_ADDRESS");

  const { data: allPermissions, isLoading: isLoadingPermissions } =
    trpcApi.permission.allWithCompletePermissions.useQuery();

  const { data: allAgents, isLoading: isLoadingAgents } =
    trpcApi.agent.all.useQuery();

  const { data: allComputedWeights, isLoading: isLoadingWeights } =
    trpcApi.computedAgentWeight.all.useQuery();

  const { data: allSignals, isLoading: isLoadingSignals } =
    trpcApi.signal.all.useQuery();

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
    isLoadingSignals ||
    lastBlock.isLoading;

  return {
    isLoading,

    graphData,

    allSignals,
    allPermissions,
    allComputedWeights,
  };
}
