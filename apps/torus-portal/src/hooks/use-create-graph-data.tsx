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
        agentWeightMap.set(agent.agentKey, agent.percComputedWeight);
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

        // Assign different colors based on role
        let color = "#54a0ff"; // default blue
        if (isGrantor && isGrantee) {
          color = "#5f27cd"; // purple for both
        } else if (isGrantor) {
          color = "#54a0ff"; // blue for grantors
        } else if (isGrantee) {
          color = "#1dd1a1"; // green for grantees
        }

        // Use computed weight if available, otherwise default to 10
        const weight = agentWeightMap.get(address) ?? 10;

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
      linkColor: "#FFFF00",
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
            linkDirectionalParticles: 3,
            linkDirectionalParticleWidth: 1,
            linkCurvature: 0,
            linkColor: "#ffffff",
            linkWidth: 1,
          });
        }
      });

      // Add missing agent nodes from allocations
      for (const [agentKey, weight] of agentsToAdd.entries()) {
        const val =
          agentKey === allocatorAddress
            ? 150
            : Math.pow(weight, 1.2) / scaleFactor;
        const color = agentKey === allocatorAddress ? "#ffffff" : "#ffff00";
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
