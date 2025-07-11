import { useMemo } from "react";

import { useLastBlock } from "@torus-ts/query-provider/hooks";
import { useTorus } from "@torus-ts/torus-provider";

import { env } from "~/env";
import { api as trpcApi } from "~/trpc/react";

import type { ComputedWeight } from "./force-graph-utils";
import { createGraphData } from "./force-graph-utils";

export function useGraphData() {
  const { api } = useTorus();
  const lastBlock = useLastBlock(api);

  const allocatorAddress = env("NEXT_PUBLIC_TORUS_ALLOCATOR_ADDRESS");

  const { data: allPermissions, isLoading: isLoadingPermissions } =
    trpcApi.permission.allWithCompletePermissions.useQuery();

  const { data: allComputedWeights, isLoading: isLoadingWeights } =
    trpcApi.computedAgentWeight.all.useQuery();

  const { data: allSignals, isLoading: isLoadingSignals } =
    trpcApi.signal.all.useQuery();
  const computedWeights: ComputedWeight[] | undefined = useMemo(() => {
    return allComputedWeights?.map((agent) => ({
      agentKey: agent.agentKey,
      agentName: agent.agentName ?? "Unknown Agent Name",
      percComputedWeight: agent.percComputedWeight,
    }));
  }, [allComputedWeights]);

  const graphData = useMemo(() => {
    return createGraphData(
      computedWeights,
      allocatorAddress,
      allSignals,
      allPermissions,
    );
  }, [computedWeights, allocatorAddress, allSignals, allPermissions]);

  const isLoading =
    isLoadingPermissions ||
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
