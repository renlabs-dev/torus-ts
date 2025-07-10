"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { MousePointerClick } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { useTorus } from "@torus-ts/torus-provider";
import { Loading } from "@torus-ts/ui/components/loading";

import { ForceGraphCanvas } from "./force-graph/force-graph-canvas";
import { useGraphData } from "./force-graph/use-graph-data";
import { GraphSheet } from "./graph-sheet/graph-sheet";
import { MyAgentButton } from "./my-agent-button";
import { NodeColorLegendDropdown } from "./node-color-legend-dropdown";
import { PermissionGraphCommand } from "./permission-graph-command";
import { PermissionGraphOverview } from "./permission-graph-overview";
import type {
  CachedAgentData,
  CustomGraphNode,
} from "./permission-graph-types";
import { AgentLRUCache } from "./permission-graph-utils";

export default function PermissionGraphContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedNode, setSelectedNode] = useState<CustomGraphNode | null>(
    null,
  );
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const agentCache = useRef(new AgentLRUCache(10));

  const {
    graphData,
    isLoading,
    allComputedWeights,
    allSignals,
    allPermissions,
  } = useGraphData();

  const { selectedAccount, isInitialized } = useTorus();

  // Handle initial selected node from query params
  useEffect(() => {
    const nodeId = searchParams.get("id");
    if (nodeId && graphData) {
      const node = graphData.nodes.find((n) => n.id === nodeId);
      if (node && (!selectedNode || selectedNode.id !== nodeId)) {
        setSelectedNode(node);
        setIsSheetOpen(true); // Open sheet when node is selected from search
      }
    } else if (nodeId && !graphData) {
      // If we have a node ID but no graph data yet, wait for it
      return;
    } else if (!nodeId && selectedNode) {
      // If no node ID in URL but we have a selected node, clear it
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
      params.set("id", node.id);
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

  function handleOnOpenChange(isOpen: boolean) {
    setIsSheetOpen(isOpen);
    if (!isOpen) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("id");
      const newUrl = params.toString() ? `/?${params.toString()}` : "/";
      router.replace(newUrl, { scroll: false });

      setTimeout(() => {
        setSelectedNode(null);
      }, 300);
    }
  }

  if (isLoading || !graphData || !isInitialized)
    return (
      <div className="w-full min-h-screen flex items-center justify-center animate-pulse">
        <Loading />
      </div>
    );

  return (
    <main>
      <div className="absolute bottom-3 left-3 right-32 z-50 flex flex-row justify-between gap-2">
        <div className="flex items-center justify-between gap-2 w-full animate-fade-down">
          <PermissionGraphCommand graphData={graphData} />
          <PermissionGraphOverview graphData={graphData} />
          <MyAgentButton graphData={graphData} onNodeClick={handleNodeSelect} />
        </div>
        <div className="flex items-center">
          <NodeColorLegendDropdown />
        </div>
        <div
          className="flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-md px-2 py-1
            animate-fade-up animate-delay-[800ms]"
        >
          <MousePointerClick className="w-4" />
          <span className="text-xs">Click on any node for detailed view.</span>
        </div>
      </div>

      <GraphSheet
        selectedNode={selectedNode}
        graphData={graphData}
        allPermissions={allPermissions}
        allComputedWeights={allComputedWeights}
        allSignals={allSignals}
        getCachedAgentData={getCachedAgentData}
        setCachedAgentData={setCachedAgentData}
        isOpen={isSheetOpen}
        onOpenChange={handleOnOpenChange}
      />
      <ForceGraphCanvas
        data={graphData}
        onNodeClick={handleNodeSelect}
        userAddress={selectedAccount?.address}
      />
    </main>
  );
}
