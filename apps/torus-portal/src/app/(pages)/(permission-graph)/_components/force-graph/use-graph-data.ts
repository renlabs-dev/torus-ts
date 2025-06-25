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
    trpcApi.permission.allWithEmissionsAndNamespaces.useQuery();

  const { data: allComputedWeights, isLoading: isLoadingWeights } =
    trpcApi.computedAgentWeight.all.useQuery();

  const { data: allSignals, isLoading: isLoadingSignals } =
    trpcApi.signal.all.useQuery();

  // Transform the new database structure to the format expected by the graph components
  const permissionDetails = useMemo((): PermissionDetails | undefined => {
    if (!rawPermissionDetails) return undefined;

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

      // Create legacy-compatible structure for graph components
      return {
        ...item,
        remainingBlocks,
        permissionType,
        // Legacy field mappings for backward compatibility
        grantorKey: permission.grantorAccountId,
        granteeKey: permission.granteeAccountId,
        permissionId: permission.permissionId,
        scope: permissionType?.toUpperCase() ?? "UNKNOWN",
        duration:
          permission.durationType === "indefinite"
            ? null
            : permission.durationBlockNumber?.toString(),
        parentId: null, // Not available in new schema yet
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
