import { useMemo } from "react";
import { api as trpcApi } from "~/trpc/react";
import { env } from "~/env";
import { useLastBlock } from "@torus-ts/query-provider/hooks";
import { useTorus } from "@torus-ts/torus-provider";
import type { PermissionDetails } from "../permission-graph-types";
import { createGraphData } from "./force-graph-utils";
import type { ComputedWeight } from "./force-graph-utils";
import { GRAPH_CONSTANTS } from "./force-graph-constants";

export function useGraphData() {
  const allocatorAddress = env("NEXT_PUBLIC_TORUS_ALLOCATOR_ADDRESS");
  const { api } = useTorus();
  const lastBlock = useLastBlock(api);

  const { data: rawPermissionDetails, isLoading: isLoadingPermissions } =
    trpcApi.permission.allWithCompletePermissions.useQuery();

  const { data: allComputedWeights, isLoading: isLoadingWeights } =
    trpcApi.computedAgentWeight.all.useQuery();

  const { data: allSignals, isLoading: isLoadingSignals } =
    trpcApi.signal.all.useQuery();

  // Transform the database structure for graph components
  const permissionDetails = useMemo((): PermissionDetails | undefined => {
    if (!rawPermissionDetails) return undefined;


    // Keep all rows as-is - the graph logic will handle the grouping
    return rawPermissionDetails.map((item) => {
      const permission = item.permissions;
      let remainingBlocks: number;

      // Handle duration calculation with new schema
      if (permission.durationType === "indefinite") {
        remainingBlocks = GRAPH_CONSTANTS.INDEFINITE_PERMISSION_BLOCKS;
      } else if (permission.durationBlockNumber && lastBlock.data) {
        const expirationBlock = Number(permission.durationBlockNumber);
        const currentBlock = lastBlock.data.blockNumber
          ? Number(lastBlock.data.blockNumber)
          : 0;

        if (currentBlock === 0) {
          remainingBlocks = expirationBlock;
        } else {
          remainingBlocks = Math.max(0, expirationBlock - currentBlock);
        }
      } else {
        remainingBlocks = 0;
      }

      // Determine permission type
      const permissionType = item.emission_permissions
        ? "emission"
        : item.namespace_permissions
          ? "namespace"
          : undefined;

      // Return enhanced permission data with computed fields
      return {
        ...item,
        remainingBlocks,
        permissionType,
        executionCount: permission.executionCount,
      };
    });
  }, [rawPermissionDetails, lastBlock]);


  const computedWeights: ComputedWeight[] | undefined = useMemo(() => {
    return allComputedWeights?.map((agent) => ({
      agentKey: agent.agentKey,
      percComputedWeight: agent.percComputedWeight,
    }));
  }, [allComputedWeights]);

  const graphData = useMemo(() => {
    return createGraphData(
      permissionDetails,
      computedWeights,
      allocatorAddress,
      allSignals,
    );
  }, [permissionDetails, computedWeights, allocatorAddress, allSignals]);

  return {
    graphData,
    isLoading:
      isLoadingPermissions ||
      isLoadingWeights ||
      isLoadingSignals ||
      lastBlock.isLoading,
    permissionDetails,
    allComputedWeights,
    allSignals,
  };
}
