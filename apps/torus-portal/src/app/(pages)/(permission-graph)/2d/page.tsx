"use client";

import { useTorus } from "@torus-ts/torus-provider";
import { KeyboardShortcutBadge } from "@torus-ts/ui/components/keyboard-shortcut-badge";
import { Loading } from "@torus-ts/ui/components/loading";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ForceGraphCanvas2D } from "../_components/force-graph/force-graph-2d";
import { useGraphData } from "../_components/force-graph/use-graph-data";
import { GraphSheet } from "../_components/graph-sheet/graph-sheet";
import { PermissionGraphFooter } from "../_components/permission-graph-footer";
import type {
  CachedAgentData,
  CustomGraphNode,
} from "../_components/permission-graph-types";
import { AgentLRUCache } from "../_components/permission-graph-utils";

export default function PermissionGraph2DPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedNode, setSelectedNode] = useState<CustomGraphNode | null>(
    null,
  );
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const agentCache = useRef(new AgentLRUCache(50));

  const {
    graphData,
    isLoading,
    allocatorAddress,
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
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSelectedNode(node);
        setIsSheetOpen(true);
      }
    } else if (nodeId && !graphData) {
      return;
    } else if (!nodeId && selectedNode) {
      setSelectedNode(null);
      setIsSheetOpen(false);
    }
  }, [searchParams, graphData, selectedNode]);

  const handleNodeSelect = useCallback(
    (node: CustomGraphNode) => {
      setSelectedNode(node);
      setIsSheetOpen(true);
      const params = new URLSearchParams(searchParams.toString());
      params.set("id", node.id);
      router.replace(`/2d?${params.toString()}`, {
        scroll: false,
      });
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
      const newUrl = params.toString() ? `/2d?${params.toString()}` : "/2d";
      router.replace(newUrl, { scroll: false });

      setTimeout(() => {
        setSelectedNode(null);
      }, 300);
    }
  }

  if (isLoading || !graphData || !isInitialized)
    return (
      <div className="fixed inset-0 flex animate-pulse flex-col items-center justify-center gap-2 text-sm">
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
      <ForceGraphCanvas2D
        graphData={graphData}
        onNodeClick={handleNodeSelect}
        userAddress={selectedAccount?.address}
        allocatorAddress={allocatorAddress}
      />
      <PermissionGraphFooter handleNodeSelect={handleNodeSelect} />
    </main>
  );
}
