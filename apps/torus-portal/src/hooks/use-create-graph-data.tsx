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

  // Fetch computed weights for allocations
  const { data: allComputedWeights, isLoading: isLoadingWeights } =
    api.computedAgentWeight.all.useQuery();

  const permissionDetails = useMemo(() => {
    if (!rawPermissionDetails) return undefined;
    return rawPermissionDetails.map((detail) => ({
      ...detail,
    }));
  }, [rawPermissionDetails]);

  const graphData = useMemo(() => {
    if (!permissionDetails || permissionDetails.length === 0) {
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
    permissionDetails.forEach((permission) => {
      uniqueAddresses.add(permission.grantor_key);
      uniqueAddresses.add(permission.grantee_key);
    });

    // Create permission nodes
    const nodes: CustomGraphNode[] = Array.from(uniqueAddresses).map(
      (address) => {
        const isGrantor = permissionDetails.some(
          (p) => p.grantor_key === address,
        );
        const isGrantee = permissionDetails.some(
          (p) => p.grantee_key === address,
        );

        // Assign different colors based on role - Modern gradient palette
        let color = "#64B5F6"; // default soft blue
        if (isGrantor && isGrantee) {
          color = "#9575CD"; // soft purple for nodes that are both
        } else if (isGrantor) {
          color = "#4FC3F7"; // light cyan for grantors
        } else if (isGrantee) {
          color = "#81C784"; // soft green for grantees
        }

        // Use computed weight if available, otherwise default to 1
        const rawWeight = agentWeightMap.get(address) ?? 1;
        // Ensure weight is a valid positive number to prevent NaN
        const weight =
          Number.isFinite(rawWeight) && rawWeight > 0 ? rawWeight : 1;

        return {
          id: address,
          name: smallAddress(address),
          color,
          val: Math.pow(weight, 1.2) / scaleFactor,
          fullAddress: address,
          role:
            isGrantor && isGrantee ? "Both" : isGrantor ? "Grantor" : "Grantee",
        };
      },
    );

    // Create permission links
    const links: CustomGraphLink[] = permissionDetails.map((permission) => ({
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
      linkCurvature: 0.5,
      linkColor: "#B39DDB", // soft lavender for permission links
      linkWidth: 0.3,
    }));

    // Now add allocation data if available
    if (allComputedWeights && allComputedWeights.length > 0) {
      // Track which agents need to be added as nodes
      const agentsToAdd = new Map<string, number>();

      // Create links from allocator to each weighted agent
      allComputedWeights.forEach((agent) => {
        const agentKey = agent.agentKey;
        const computedAgentWeight = agent.percComputedWeight;

        // Check if agent node exists
        if (!nodes.find((node) => node.id === agentKey)) {
          agentsToAdd.set(agentKey, computedAgentWeight);
        }

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

      // Add missing agent nodes from allocations
      for (const [agentKey, rawWeight] of agentsToAdd.entries()) {
        // Ensure weight is a valid positive number to prevent NaN
        const weight =
          Number.isFinite(rawWeight) && rawWeight > 0 ? rawWeight : 1;
        const val =
          agentKey === allocatorAddress
            ? 150
            : Math.pow(weight, 1.2) / scaleFactor;
        const color = agentKey === allocatorAddress ? "#ffffff" : "#FFB74D"; // white for allocator, soft orange for allocated agents
        nodes.push({
          id: agentKey,
          name: smallAddress(agentKey),
          color: color,
          val: val,
          fullAddress: agentKey,
          role: "Allocated Agent",
        });
      }
    }

    return { nodes, links };
  }, [permissionDetails, allComputedWeights, allocatorAddress]);

  return {
    graphData,
    isLoading: isLoadingPermissions || isLoadingWeights,
    permissionDetails,
  };
}
