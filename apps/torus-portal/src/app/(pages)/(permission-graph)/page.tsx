"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { useTorus } from "@torus-ts/torus-provider";
import { KeyboardShortcutBadge } from "@torus-ts/ui/components/keyboard-shortcut-badge";
import { Loading } from "@torus-ts/ui/components/loading";

import { ForceGraphCanvas } from "./_components/force-graph/force-graph-canvas";
import { useGraphData } from "./_components/force-graph/use-graph-data";
import { GraphSheet } from "./_components/graph-sheet/graph-sheet";
import { PermissionGraphFooter } from "./_components/permission-graph-footer";
import type {
  CachedAgentData,
  CustomGraphNode,
} from "./_components/permission-graph-types";
import { AgentLRUCache } from "./_components/permission-graph-utils";

export default function PermissionGraphPage() {
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
      <div
        className="fixed inset-0 flex flex-col items-center text-sm justify-center animate-pulse
          gap-2"
      >
        <span className="flex items-center gap-2">
          <Loading /> Loading...
        </span>
        <span>
          Tip: you can use <KeyboardShortcutBadge keyboardKey="B" /> to open the
          sidebar.
        </span>
      </div>
    );

  return (
    <main>
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
      <PermissionGraphFooter handleNodeSelect={handleNodeSelect} />
    </main>
  );
}
