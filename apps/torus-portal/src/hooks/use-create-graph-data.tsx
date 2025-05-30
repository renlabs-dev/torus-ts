import { useMemo } from "react";
import { api } from "~/trpc/react";
import type {
  CustomGraphNode,
  CustomGraphLink,
} from "../app/(permission-graph)/_components/permission-graph-types";
import { env } from "~/env";
import { smallAddress } from "@torus-network/torus-utils/subspace";

export function useCreateGraphData() {
  const allocatorAddress = env("NEXT_PUBLIC_TORUS_ALLOCATOR_ADDRESS");

  const scaleFactor = 5;

  // Fetch permission details
  const { data: rawPermissionDetails, isLoading: isLoadingPermissions } =
    api.permissionDetails.all.useQuery();

  console.log("Raw permission details: ", rawPermissionDetails);

  // Fetch computed weights for allocations
  const { data: allComputedWeights, isLoading: isLoadingWeights } =
    api.computedAgentWeight.all.useQuery();

  console.log("Raw computed weights: ", allComputedWeights);

  const permissionDetails = useMemo(() => {
    if (!rawPermissionDetails) return undefined;
    return rawPermissionDetails.map((detail) => ({
      ...detail,
    }));
  }, [rawPermissionDetails]);

  const graphData = useMemo(() => {
    // Allow graph to render if we have either permissions OR computed weights
    if (
      (!permissionDetails || permissionDetails.length === 0) &&
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
    if (permissionDetails && permissionDetails.length > 0) {
      permissionDetails.forEach((permission) => {
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
          permissionDetails?.some((p) => p.grantor_key === address) ?? false;
        const isGrantee =
          permissionDetails?.some((p) => p.grantee_key === address) ?? false;
        const isAllocator = address === allocatorAddress;

        // Check if this is an allocated agent (has weight but no permissions)
        const hasWeight = agentWeightMap.has(address);
        const isAllocatedOnly =
          hasWeight && !isGrantor && !isGrantee && !isAllocator;

        // Assign different colors based on role - Modern gradient palette
        let color = "#64B5F6"; // default soft blue
        let role = "";

        if (isAllocator) {
          color = "#ffffff"; // white for allocator
          role = "Allocator";
        } else if (isAllocatedOnly) {
          color = "#FFB74D"; // soft orange for allocated agents
          role = "Allocated Agent";
        } else if (isGrantor && isGrantee) {
          color = "#9575CD"; // soft purple for nodes that are both
          role = "Both";
        } else if (isGrantor) {
          color = "#4FC3F7"; // light cyan for grantors
          role = "Grantor";
        } else if (isGrantee) {
          color = "#81C784"; // soft green for grantees
          role = "Grantee";
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

        return {
          id: address,
          name: smallAddress(address),
          color,
          val,
          fullAddress: address,
          role,
        };
      },
    );

    // Create permission links
    const links: CustomGraphLink[] =
      permissionDetails && permissionDetails.length > 0
        ? permissionDetails.map((permission) => ({
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
            linkCurvature: 0.2,
            linkColor: "#B39DDB", // soft lavender for permission links
            linkWidth: 0.3,
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
            linkDirectionalParticles: computedAgentWeight / (scaleFactor * 2),
            linkDirectionalParticleWidth: 1,
            linkCurvature: 0,
            linkColor: "#90CAF9", // soft sky blue for allocation links
            linkWidth: 1,
          });
        }
      });
    }

    return { nodes, links };
  }, [permissionDetails, allComputedWeights, allocatorAddress]);

  return {
    graphData,
    isLoading: isLoadingPermissions || isLoadingWeights,
    permissionDetails,
  };
}
