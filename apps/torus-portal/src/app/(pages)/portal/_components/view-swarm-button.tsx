"use client";

import { Button } from "@torus-ts/ui/components/button";
import { Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { getAvailableSwarms } from "./force-graph-2d/force-graph-2d-utils";
import type {
  CustomGraphData,
  CustomGraphNode,
} from "./permission-graph-types";

interface ViewSwarmButtonProps {
  selectedNode: CustomGraphNode;
  graphData: CustomGraphData | null;
  allocatorAddress: string;
}

export function ViewSwarmButton({
  selectedNode,
  graphData,
  allocatorAddress,
}: ViewSwarmButtonProps) {
  const router = useRouter();

  // Find which swarm this node belongs to

  const nodeSwarm = useMemo(() => {
    if (!graphData) return null;

    const swarms = getAvailableSwarms(
      graphData.nodes,
      graphData.links,
      allocatorAddress,
    );

    // Find swarm that contains this node
    return swarms.find((swarm) => swarm.connectedNodeIds.has(selectedNode.id));
  }, [graphData, selectedNode.id, allocatorAddress]);

  // Don't show button for allocator node, permission nodes, or if no swarm found
  if (
    !nodeSwarm ||
    selectedNode.id === allocatorAddress ||
    selectedNode.nodeType === "permission"
  ) {
    return null;
  }

  const handleViewSwarm = () => {
    const rootAgent = graphData?.nodes.find(
      (n) => n.id === nodeSwarm.rootAgentId,
    );
    if (rootAgent) {
      router.push(`/portal/2d-hypergraph?swarm=${rootAgent.name.toLowerCase()}`);
    }
  };

  return (
    <Button
      onClick={handleViewSwarm}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      <Users className="h-4 w-4" />
      View Isolated Swarm Subgraph
    </Button>
  );
}
