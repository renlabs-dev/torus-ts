"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PortalNavigationTabs from "../../_components/portal-navigation-tabs";
import type {
  CustomGraphNode,
  CachedAgentData,
} from "./permission-graph-types";
import { AgentLRUCache } from "./permission-graph-utils";
import { PermissionGraphNodeDetails } from "./node-details";
import PermissionGraphSearch from "./permission-graph-search";
import { PermissionGraphOverview } from "./permission-graph-overview";
import { MousePointerClick } from "lucide-react";
import { NodeColorLegend } from "./node-color-legend";
import { MyAgentButton } from "./my-agent-button";
import { useTorus } from "@torus-ts/torus-provider";
import { useGraphData } from "./force-graph/use-graph-data";
import { PermissionGraph } from "./force-graph/force-graph-canvas";
import { Loading } from "@torus-ts/ui/components/loading";

export default function PermissionGraphContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedNode, setSelectedNode] = useState<CustomGraphNode | null>(
    null,
  );
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const agentCache = useRef(new AgentLRUCache(10));

  const { graphData, isLoading, permissionDetails, allComputedWeights } =
    useGraphData();
  const { selectedAccount } = useTorus();

  // Handle initial selected node from query params
  useEffect(() => {
    const agentId = searchParams.get("agent");
    if (agentId && graphData) {
      const node = graphData.nodes.find((n) => n.id === agentId);
      if (node && (!selectedNode || selectedNode.id !== agentId)) {
        setSelectedNode(node);
        setIsSheetOpen(true); // Open sheet when node is selected from search
      }
    } else if (agentId && !graphData) {
      // If we have an agent ID but no graph data yet, wait for it
      return;
    } else if (!agentId && selectedNode) {
      // If no agent in URL but we have a selected node, clear it
      setSelectedNode(null);
      setIsSheetOpen(false);
    }
  }, [searchParams, graphData, selectedNode]);

  const handleNodeSelect = useCallback(
    (node: CustomGraphNode) => {
      setSelectedNode(node);
      setIsSheetOpen(true);
      // Update query parameter instead of navigation
      const params = new URLSearchParams(searchParams.toString());
      params.set("agent", node.id);
      router.replace(`/?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const getCachedAgentData = useCallback(
    (nodeId: string): CachedAgentData | null => {
      return agentCache.current.get(nodeId);
    },
    [],
  );

  const setCachedAgentData = useCallback(
    (nodeId: string, data: CachedAgentData): void => {
      agentCache.current.set(nodeId, data);
    },
    [],
  );

  // Cleanup cache on unmount
  useEffect(() => {
    const cache = agentCache.current;
    return () => {
      cache.clear();
    };
  }, []);

  if (isLoading || !graphData)
    return (
      <div className="w-full min-h-full">
        <Loading />
      </div>
    );

  return (
    <div className="fixed inset-0 w-screen h-screen">
      <div
        className="absolute bottom-2 left-2 right-2 md:bottom-[3.3em] z-50 flex flex-col
          sm:flex-row justify-between gap-2"
      >
        <div className="flex items-center">
          <NodeColorLegend />
        </div>
        <div
          className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-md px-2 py-1
            animate-fade-up animate-delay-[800ms]"
        >
          <MousePointerClick className="w-4" />
          <span className="text-xs">Click on any node for detailed view.</span>
        </div>
      </div>
      <div className="absolute top-[3.9rem] left-2 right-2 z-10">
        {/* Desktop layout */}
        <div className="hidden lg:flex items-center gap-2 w-full animate-fade-down">
          <PortalNavigationTabs />
          <PermissionGraphOverview graphData={graphData} />
          <MyAgentButton graphData={graphData} onNodeClick={handleNodeSelect} />
          <div className="flex-1">
            <PermissionGraphSearch
              graphNodes={graphData.nodes.map((node) => node.id)}
            />
          </div>
        </div>

        {/* Mobile/Tablet layout - stacked */}
        <div className="flex flex-col gap-2 lg:hidden">
          <div className="flex items-center gap-2 overflow-x-auto">
            <PortalNavigationTabs />
            <MyAgentButton
              graphData={graphData}
              onNodeClick={handleNodeSelect}
            />
          </div>
          <PermissionGraphSearch
            graphNodes={graphData.nodes.map((node) => node.id)}
          />
          <PermissionGraphOverview graphData={graphData} />
        </div>
      </div>
      <PermissionGraphNodeDetails
        selectedNode={selectedNode}
        graphData={graphData}
        permissionDetails={permissionDetails}
        allComputedWeights={allComputedWeights}
        getCachedAgentData={getCachedAgentData}
        setCachedAgentData={setCachedAgentData}
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />
      <div className="w-full h-full animate-fade animate-delay-1000">
        <PermissionGraph
          data={graphData}
          onNodeClick={handleNodeSelect}
          userAddress={selectedAccount?.address}
        />
      </div>
    </div>
  );
}
