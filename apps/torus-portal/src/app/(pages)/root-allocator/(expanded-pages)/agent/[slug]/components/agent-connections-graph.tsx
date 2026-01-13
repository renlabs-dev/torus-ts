"use client";

import { Loading } from "@torus-ts/ui/components/loading";
import { ForceGraphCanvas2D } from "~/app/(pages)/portal/_components/force-graph-2d/force-graph-2d";
import { getConnectedNodesSwarm } from "~/app/(pages)/portal/_components/force-graph-2d/force-graph-2d-utils";
import { useGraphData } from "~/app/(pages)/portal/_components/force-graph/use-graph-data";
import { useMemo } from "react";

interface AgentConnectionsGraphProps {
  agentKey: string;
}

export function AgentConnectionsGraph({
  agentKey,
}: AgentConnectionsGraphProps) {
  const { graphData, isLoading, allocatorAddress } = useGraphData();

  // Filter graph data to show only nodes connected to this agent
  const filteredGraphData = useMemo(() => {
    if (!graphData) return null;

    // Find the agent node
    const agentNode = graphData.nodes.find((n) => n.id === agentKey);
    if (!agentNode) return null;

    // Get all connected nodes using the swarm traversal logic
    const connectedNodeIds = getConnectedNodesSwarm(
      agentKey,
      graphData.nodes,
      graphData.links,
      allocatorAddress,
    );

    // Filter nodes (exclude allocator from the filtered view)
    const filteredNodes = graphData.nodes.filter(
      (node) => connectedNodeIds.has(node.id) && node.id !== allocatorAddress,
    );

    // Filter links to only include those between connected nodes (excluding allocator)
    const filteredLinks = graphData.links.filter((link) => {
      const sourceId =
        typeof link.source === "string"
          ? link.source
          : (link.source as { id: string }).id;
      const targetId =
        typeof link.target === "string"
          ? link.target
          : (link.target as { id: string }).id;
      return (
        connectedNodeIds.has(sourceId) &&
        connectedNodeIds.has(targetId) &&
        sourceId !== allocatorAddress &&
        targetId !== allocatorAddress
      );
    });

    // Only show graph if there are connections (more than just the agent itself)
    if (filteredNodes.length <= 1) return null;

    return {
      nodes: filteredNodes,
      links: filteredLinks,
    };
  }, [graphData, agentKey, allocatorAddress]);

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Loading /> Loading network connections...
        </div>
      </div>
    );
  }

  if (!filteredGraphData) {
    return (
      <div className="flex h-[200px] items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/50">
        <p className="text-sm text-zinc-400">No network connections found</p>
      </div>
    );
  }

  return (
    <div className="relative h-[400px] overflow-hidden rounded-lg border border-zinc-800">
      <ForceGraphCanvas2D
        graphData={filteredGraphData}
        onNodeClick={() => {
          /* empty */
        }}
        allocatorAddress={allocatorAddress}
        swarmCenterNodeId={agentKey}
        contained
      />
    </div>
  );
}
