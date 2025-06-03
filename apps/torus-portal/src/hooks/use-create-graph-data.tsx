import { useMemo } from "react";
import { api as extApi } from "~/trpc/react";
import type {
  CustomGraphNode,
  CustomGraphLink,
} from "../app/(permission-graph)/_components/permission-graph-types";
import { env } from "~/env";
import { smallAddress } from "@torus-network/torus-utils/subspace";
import { useLastBlock } from "@torus-ts/query-provider/hooks";
import { useTorus } from "@torus-ts/torus-provider";

export function useCreateGraphData() {
  const allocatorAddress = env("NEXT_PUBLIC_TORUS_ALLOCATOR_ADDRESS");

  const { api } = useTorus();

  const scaleFactor = 5;

  const lastBlock = useLastBlock(api);

  // Fetch permission details
  const { data: rawPermissionDetails, isLoading: isLoadingPermissions } =
    extApi.permissionDetails.all.useQuery();

  // Fetch computed weights for allocations
  const { data: allComputedWeights, isLoading: isLoadingWeights } =
    extApi.computedAgentWeight.all.useQuery();

  // Process permission details without including lastBlock to avoid re-renders
  const basePermissionDetails = useMemo(() => {
    if (!rawPermissionDetails) return undefined;
    return rawPermissionDetails;
  }, [rawPermissionDetails]);

  // Calculate remaining blocks separately to avoid graph re-renders
  const permissionDetails = useMemo(() => {
    if (!basePermissionDetails) return undefined;

    return basePermissionDetails.map((detail) => {
      // Calculate remaining blocks
      // Note: 'duration' field is actually the expiration block number (misnomed in DB)
      let remainingBlocks: number;

      // todo : remove when its fixed in the DB
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (detail.duration === null) {
        // Null duration means indefinite/never-ending permission
        remainingBlocks = 999999999; // Large number to indicate indefinite
        // todo: remove this when fixed in the db
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      } else if (lastBlock) {
        // Parse the numeric string to number
        const expirationBlock = parseInt(detail.duration, 10);
        const currentBlock = Number(lastBlock.data?.blockNumber);

        // Check for NaN
        if (isNaN(expirationBlock)) {
          remainingBlocks = 0;
        } else {
          // Simple calculation: expiration block - current block
          remainingBlocks = Math.max(0, expirationBlock - currentBlock);
        }
      } else {
        // If we don't have lastBlock data yet, we can't calculate
        remainingBlocks = 0;
      }

      return {
        ...detail,
        remainingBlocks,
      };
    });
  }, [basePermissionDetails, lastBlock]);

  const graphData = useMemo(() => {
    // Allow graph to render if we have either permissions OR computed weights
    if (
      (!basePermissionDetails || basePermissionDetails.length === 0) &&
      (!allComputedWeights || allComputedWeights.length === 0)
    ) {
      return null;
    }

    // Create a map of agent weights for easy lookup
    const agentWeightMap = new Map<string, number>();
    if (allComputedWeights) {
      allComputedWeights.forEach((agent) => {
        // Validate weight before storing to prevent NaN propagation
        const weight = agent.percComputedWeight;
        if (Number.isFinite(weight) && weight >= 0) {
          agentWeightMap.set(agent.agentKey, weight);
        }
      });
    }

    // First, create nodes and links from permissions
    const uniqueAddresses = new Set<string>();
    if (basePermissionDetails && basePermissionDetails.length > 0) {
      basePermissionDetails.forEach((permission) => {
        uniqueAddresses.add(permission.grantor_key);
        uniqueAddresses.add(permission.grantee_key);
      });
    }

    // Always include the allocator address if we have computed weights
    if (
      allComputedWeights &&
      allComputedWeights.length > 0 &&
      allocatorAddress
    ) {
      uniqueAddresses.add(allocatorAddress);

      // Also add all agents with computed weights to ensure they're included
      allComputedWeights.forEach((agent) => {
        uniqueAddresses.add(agent.agentKey);
      });
    }

    // Create permission nodes
    const nodes: CustomGraphNode[] = Array.from(uniqueAddresses).map(
      (address) => {
        const isGrantor =
          basePermissionDetails?.some((p) => p.grantor_key === address) ??
          false;
        const isGrantee =
          basePermissionDetails?.some((p) => p.grantee_key === address) ??
          false;
        const isAllocator = address === allocatorAddress;

        // Check if this is an allocated agent (has weight but no permissions)
        const hasWeight = agentWeightMap.has(address);
        const isAllocatedOnly =
          hasWeight && !isGrantor && !isGrantee && !isAllocator;

        // Check if this node is directly connected to the allocator
        const isConnectedToAllocator = hasWeight && !isAllocator;

        // Assign different colors based on role - Modern gradient palette
        let color = "#64B5F6"; // default soft blue
        let role = "";
        let opacity = 0.5;

        if (isAllocator) {
          color = "#ffffff"; // white for allocator
          role = "Allocator";
          opacity = 1;
        } else if (isConnectedToAllocator) {
          // All nodes connected to allocator get the same gold color
          color = "#FFD700"; // gold for all connected nodes

          // Still track their role
          if (isAllocatedOnly) {
            role = "Allocated Agent";
          } else if (isGrantor && isGrantee) {
            role = "Both";
          } else if (isGrantor) {
            role = "Grantor";
          } else if (isGrantee) {
            role = "Grantee";
          }
        } else {
          // Nodes NOT connected to allocator keep original vibrant colors
          if (isGrantor && isGrantee) {
            color = "#9575CD"; // soft purple for nodes that are both
            role = "Both";
          } else if (isGrantor) {
            color = "#4FC3F7"; // light cyan for grantors
            role = "Grantor";
          } else if (isGrantee) {
            color = "#81C784"; // soft green for grantees
            role = "Grantee";
          }
        }

        // Use computed weight if available, otherwise default to 1
        const rawWeight = agentWeightMap.get(address) ?? 1;
        // Ensure weight is a valid positive number to prevent NaN
        const weight =
          Number.isFinite(rawWeight) && rawWeight > 0 ? rawWeight : 1;

        // Special size for allocator
        const val = isAllocator
          ? 200
          : Math.max(Math.pow(weight, 1.2) / scaleFactor, 5);

        // Fix position for allocator to keep it centered
        const node: CustomGraphNode = {
          id: address,
          name: smallAddress(address),
          color,
          val,
          fullAddress: address,
          role,
          opacity: opacity,
        };

        // Pin the allocator to the center
        if (isAllocator) {
          node.fx = 0; // Fixed x position at center
          node.fy = 0; // Fixed y position at center
          node.fz = 0; // Fixed z position at center
        }

        return node;
      },
    );

    // Create permission links
    const links: CustomGraphLink[] =
      basePermissionDetails && basePermissionDetails.length > 0
        ? basePermissionDetails.map((permission) => ({
            linkType: "permission",
            source: permission.grantor_key,
            target: permission.grantee_key,
            id: permission.permission_id,
            scope: permission.scope,
            duration: permission.duration,
            parentId: permission.parent_id ?? "",
            enforcement: "default_enforcement", // TODO: Fetch from enforcementAuthoritySchema
            linkDirectionalArrowLength: 3.5,
            linkDirectionalArrowRelPos: 1,
            linkCurvature: 0.3,
            linkColor: "#B39DDB", // soft lavender for permission links
            linkWidth: 1.5, // Increased width for better visibility
            linkOpacity: 0.6,
          }))
        : [];

    // Now add allocation data if available
    if (allComputedWeights && allComputedWeights.length > 0) {
      // Create links from allocator to each weighted agent
      allComputedWeights.forEach((agent) => {
        const agentKey = agent.agentKey;
        const computedAgentWeight = agent.percComputedWeight;

        // Check if link already exists
        const linkExists = links.some(
          (link) =>
            link.source === allocatorAddress &&
            link.target === agentKey &&
            link.scope === "allocation",
        );

        if (!linkExists && allocatorAddress !== agentKey) {
          links.push({
            linkType: "allocation",
            source: allocatorAddress,
            target: agentKey,
            id: `allocation-${agentKey}`,
            linkDirectionalParticles: Math.max(2, computedAgentWeight),
            linkDirectionalParticleWidth: 2.5,
            linkCurvature: 0,
            linkColor: "#90CAF9", // soft sky blue for allocation links
            linkWidth: 2.5, // Thicker width for allocation links
            linkOpacity: 0.8,
          });
        }
      });
    }

    return { nodes, links };
  }, [basePermissionDetails, allComputedWeights, allocatorAddress]);

  // Check if lastBlock is loading (separate from data loading)
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const isLastBlockLoading = !lastBlock && api;

  return {
    graphData,
    isLoading: isLoadingPermissions || isLoadingWeights || isLastBlockLoading,
    permissionDetails,
    allComputedWeights, // Expose the weights data
  };
}
