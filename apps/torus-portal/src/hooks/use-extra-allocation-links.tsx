import { useEffect } from "react";
import { api } from "~/trpc/react";
import type {
  CustomGraphNode,
  GraphLink,
} from "../app/(permission-graph)/_components/permission-graph-utils";
import { env } from "~/env";
import { smallAddress } from "@torus-network/torus-utils/subspace";

interface AllocatorLinksProps {
  nodes: CustomGraphNode[];
  links: GraphLink[];
  onUpdate: (nodes: CustomGraphNode[], links: GraphLink[]) => void;
}

export function useExtraAllocatorLinks({
  nodes,
  links,
  onUpdate,
}: AllocatorLinksProps) {
  const allocatorAddress = env("NEXT_PUBLIC_TORUS_ALLOCATOR_ADDRESS");

  // Fetch all computed weights
  const { data: allComputedWeights } = api.computedAgentWeight.all.useQuery();

  useEffect(() => {
    if (!allComputedWeights || allComputedWeights.length === 0) return;

    // Create a copy of nodes and links
    const updatedNodes = [...nodes];
    const updatedLinks = [...links];

    // Track which agents need to be added as nodes
    const agentsToAdd = new Set<string>();

    // Create links from allocator to each weighted agent
    allComputedWeights.forEach((weight) => {
      const agentKey = weight.agentKey;

      // Check if agent node exists
      if (!updatedNodes.find((node) => node.id === agentKey)) {
        agentsToAdd.add(agentKey);
      }

      // Check if link already exists
      const linkExists = updatedLinks.some(
        (link) =>
          link.source === allocatorAddress &&
          link.target === agentKey &&
          link.scope === "allocation",
      );

      if (!linkExists) {
        // Create allocation link
        if (allocatorAddress !== agentKey) {
          updatedLinks.push({
            linkType: "allocation",
            source: allocatorAddress,
            target: agentKey,
            id: `allocation-${agentKey}`,
            scope: "allocation",
            duration: `${weight.percComputedWeight.toFixed(2)}%`,
            enforcement: "weighted_allocation",
          });
        }
      }
    });

    // Add missing agent nodes
    agentsToAdd.forEach((agentKey) => {
      updatedNodes.push({
        id: agentKey,
        name: smallAddress(agentKey),
        color: "#48dbfb", // Light blue for allocated agents
        val: 8,
        fullAddress: agentKey,
        role: "Allocated Agent",
      });
    });

    // Only update if there are changes
    if (agentsToAdd.size > 0 || updatedLinks.length > links.length) {
      onUpdate(updatedNodes, updatedLinks);
    }
  }, [allComputedWeights, nodes, links, allocatorAddress, onUpdate]);
}
