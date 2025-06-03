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
    trpcApi.permissionDetails.all.useQuery();

  const { data: allComputedWeights, isLoading: isLoadingWeights } =
    trpcApi.computedAgentWeight.all.useQuery();

  const basePermissionDetails = useMemo(() => {
    if (!rawPermissionDetails) return undefined;
    return rawPermissionDetails;
  }, [rawPermissionDetails]);

  const permissionDetails = useMemo((): PermissionDetails | undefined => {
    if (!basePermissionDetails) return undefined;

    return basePermissionDetails.map((detail) => {
      let remainingBlocks: number;

      if (detail.duration === null) {
        remainingBlocks = GRAPH_CONSTANTS.INDEFINITE_PERMISSION_BLOCKS;
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      } else if (lastBlock) {
        const expirationBlock = parseInt(detail.duration, 10);
        const currentBlock = lastBlock.data?.blockNumber
          ? Number(lastBlock.data.blockNumber)
          : 0;

        if (isNaN(expirationBlock) || currentBlock === 0) {
          remainingBlocks = 0;
        } else {
          remainingBlocks = Math.max(0, expirationBlock - currentBlock);
        }
      } else {
        remainingBlocks = 0;
      }

      return {
        ...detail,
        remainingBlocks,
      };
    });
  }, [basePermissionDetails, lastBlock]);

  const computedWeights: ComputedWeight[] | undefined = useMemo(() => {
    return allComputedWeights?.map((agent) => ({
      agentKey: agent.agentKey,
      percComputedWeight: agent.percComputedWeight,
    }));
  }, [allComputedWeights]);

  const graphData = useMemo(() => {
    return createGraphData(
      basePermissionDetails,
      computedWeights,
      allocatorAddress,
    );
  }, [basePermissionDetails, computedWeights, allocatorAddress]);

  return {
    graphData,
    isLoading: isLoadingPermissions || isLoadingWeights || lastBlock.isLoading,
    permissionDetails,
    allComputedWeights,
  };
}
