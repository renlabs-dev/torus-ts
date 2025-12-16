"use client";

import { useTorus } from "@torus-ts/torus-provider";
import { KeyboardShortcutBadge } from "@torus-ts/ui/components/keyboard-shortcut-badge";
import { Loading } from "@torus-ts/ui/components/loading";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ForceGraphCanvas2D } from "../_components/force-graph-2d/force-graph-2d";
import { getAvailableSwarms } from "../_components/force-graph-2d/force-graph-2d-utils";
import { useGraphData } from "../_components/force-graph/use-graph-data";
import { GraphSheet } from "../_components/graph-sheet/graph-sheet";
import { PermissionGraphFooter } from "../_components/permission-graph-footer";
import type {
  CachedAgentData,
  CustomGraphNode,
} from "../_components/permission-graph-types";
import { AgentLRUCache } from "../_components/permission-graph-utils";
import { SwarmSelectionCommand } from "../_components/swarm-selection-command";

const PAGE_URL = "/portal/2d-hypergraph";

export default function PermissionGraph2DPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedNode, setSelectedNode] = useState<CustomGraphNode | null>(
    null,
  );
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedNodeIdForGraph, setSelectedNodeIdForGraph] = useState<
    string | null
  >(null);
  const [selectedSwarmId, setSelectedSwarmId] = useState<string | null>(null);
  const [swarmCenterNodeId, setSwarmCenterNodeId] = useState<string | null>(
    null,
  );
  const [isInitialQueryParamsProcessed, setIsInitialQueryParamsProcessed] =
    useState(false);

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

  // Handle initial selected node and swarm from query params
  useEffect(() => {
    const nodeId = searchParams.get("agent");
    const swarmParam = searchParams.get("swarm");

    if (graphData) {
      if (swarmParam) {
        const availableSwarms = getAvailableSwarms(
          graphData.nodes,
          graphData.links,
          allocatorAddress,
        );
        const swarm = availableSwarms.find(
          (s) => s.rootAgentName.toLowerCase() === swarmParam.toLowerCase(),
        );

        if (swarm && selectedSwarmId !== swarm.id) {
          const rootAgent = graphData.nodes.find(
            (n) => n.id === swarm.rootAgentId,
          );
          if (rootAgent) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelectedSwarmId(swarm.id);
            setSwarmCenterNodeId(rootAgent.id);
          }
        }
      } else if (!swarmParam && selectedSwarmId) {
        setSelectedSwarmId(null);
        setSwarmCenterNodeId(null);
      }

      if (nodeId) {
        const node = graphData.nodes.find((n) => n.id === nodeId);
        if (node && selectedNode?.id !== nodeId) {
          setSelectedNode(node);
          setIsSheetOpen(true);
          setSelectedNodeIdForGraph(nodeId);
        }
      } else if (!nodeId && selectedNode) {
        setSelectedNode(null);
        setIsSheetOpen(false);
        setSelectedNodeIdForGraph(null);
      }

      // Mark initial query params as processed
      if (!isInitialQueryParamsProcessed) {
        setIsInitialQueryParamsProcessed(true);
      }
    }
  }, [
    searchParams,
    graphData,
    selectedNode,
    selectedSwarmId,
    allocatorAddress,
    isInitialQueryParamsProcessed,
  ]);

  const handleNodeSelect = useCallback(
    (node: CustomGraphNode) => {
      setSelectedNode(node);
      setIsSheetOpen(true);
      setSelectedNodeIdForGraph(node.id);

      const currentUrl = new URL(window.location.href);
      const params = new URLSearchParams(currentUrl.search);
      params.set("agent", node.id);
      router.replace(`${PAGE_URL}?${params.toString()}`, {
        scroll: false,
      });
    },
    [router],
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
      // Clear graph selection when sheet closes
      setSelectedNodeIdForGraph(null);

      const params = new URLSearchParams(searchParams.toString());
      params.delete("agent");
      const newUrl = params.toString()
        ? `${PAGE_URL}?${params.toString()}`
        : PAGE_URL;
      router.replace(newUrl, { scroll: false });

      setTimeout(() => {
        setSelectedNode(null);
      }, 300);
    }
  }

  const handleSwarmSelect = useCallback(
    (swarmId: string, rootAgentNode: CustomGraphNode) => {
      setSelectedSwarmId(swarmId);
      setSwarmCenterNodeId(rootAgentNode.id);

      // Clear any existing node selection when switching to swarm view
      setSelectedNode(null);
      setIsSheetOpen(false);
      setSelectedNodeIdForGraph(null);

      const params = new URLSearchParams(searchParams.toString());
      params.set("swarm", rootAgentNode.name.toLowerCase());
      // Remove agent param when switching to swarm view
      params.delete("agent");
      router.replace(`${PAGE_URL}?${params.toString()}`, {
        scroll: false,
      });
    },
    [router, searchParams],
  );

  const handleShowAll = useCallback(() => {
    setSelectedSwarmId(null);
    setSwarmCenterNodeId(null);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("swarm");
    // Keep agent param if there's a selected node
    const newUrl = params.toString()
      ? `${PAGE_URL}?${params.toString()}`
      : PAGE_URL;
    router.replace(newUrl, { scroll: false });
  }, [router, searchParams]);

  if (
    isLoading ||
    !graphData ||
    !isInitialized ||
    !isInitialQueryParamsProcessed
  )
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
        allocatorAddress={allocatorAddress}
      />
      <ForceGraphCanvas2D
        graphData={graphData}
        onNodeClick={handleNodeSelect}
        userAddress={selectedAccount?.address}
        allocatorAddress={allocatorAddress}
        selectedNodeId={selectedNodeIdForGraph}
        onSelectionChange={setSelectedNodeIdForGraph}
        selectedSwarmId={selectedSwarmId}
        swarmCenterNodeId={swarmCenterNodeId}
      />
      <PermissionGraphFooter
        handleNodeSelect={handleNodeSelect}
        extraContent={
          <SwarmSelectionCommand
            graphData={graphData}
            allocatorAddress={allocatorAddress}
            selectedSwarmId={selectedSwarmId}
            onSwarmSelect={handleSwarmSelect}
            onShowAll={handleShowAll}
          />
        }
      />
    </main>
  );
}
