"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PermissionGraph from "./permission-graph";
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
import { useCreateGraphData } from "../../../hooks/use-create-graph-data";

export default function PermissionGraphContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedNode, setSelectedNode] = useState<CustomGraphNode | null>(
    null,
  );
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const agentCache = useRef(new AgentLRUCache(10));

  const { graphData, isLoading, permissionDetails } = useCreateGraphData();

  // Handle initial selected node from query params
  useEffect(() => {
    const agentId = searchParams.get("agent");
    if (agentId && graphData) {
      const node = graphData.nodes.find((n) => n.id === agentId);
      if (node && (!selectedNode || selectedNode.id !== agentId)) {
        setSelectedNode(node);
      }
    } else if (agentId && !graphData) {
      // If we have an agent ID but no graph data yet, wait for it
      return;
    } else if (!agentId && selectedNode) {
      // If no agent in URL but we have a selected node, clear it
      setSelectedNode(null);
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

  return (
    <div className="fixed inset-0 w-screen h-screen">
      <div
        className="absolute right-0 md:bottom-14 bottom-2 gap-2 items-center flex flex-row md:px-4
          px-2 z-50"
      >
        <MousePointerClick className="w-4" />
        <span className="text-xs"> Click on any node for detailed view.</span>
      </div>
      <div className="absolute top-[3.9rem] w-screen left-2 right-96 z-10">
        <div className="flex md:flex-row flex-col items-center gap-2 w-full">
          <PortalNavigationTabs />
          <PermissionGraphOverview graphData={graphData} />
          <div className="flex-1 w-full">
            <PermissionGraphSearch
              graphNodes={graphData?.nodes.map((node) => node.id) ?? []}
            />
          </div>
        </div>
      </div>
      <PermissionGraphNodeDetails
        selectedNode={selectedNode}
        graphData={graphData}
        permissionDetails={permissionDetails}
        getCachedAgentData={getCachedAgentData}
        setCachedAgentData={setCachedAgentData}
        isOpen={isSheetOpen}
        onOpenChange={setIsSheetOpen}
      />
      <div className="w-full h-full">
        {isLoading ? (
          <div className="flex items-center justify-center w-full h-full">
            <div className="text-xl">Loading permission graph...</div>
          </div>
        ) : (
          <PermissionGraph data={graphData} onNodeClick={handleNodeSelect} />
        )}
      </div>
    </div>
  );
}
