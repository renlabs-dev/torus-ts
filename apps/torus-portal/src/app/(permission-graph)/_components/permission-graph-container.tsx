"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import PermissionGraph from "./permission-graph";
import PortalNavigationTabs from "../../_components/portal-navigation-tabs";
import type {
  CustomGraphData,
  CustomGraphNode,
} from "./permission-graph-utils";
import { AgentLRUCache } from "./permission-graph-utils";
import type { CachedAgentData } from "./permission-graph-utils";
import { PermissionGraphNodeDetails } from "./node-details";
import { api } from "~/trpc/react";
import PermissionGraphSearch from "./permission-graph-search";

export default function PermissionGraphContainer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [graphData, setGraphData] = useState<CustomGraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<CustomGraphNode | null>(
    null,
  );
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const agentCache = useRef(new AgentLRUCache(10));

  const { data: permissionDetails, isLoading } =
    api.permissionDetails.all.useQuery();

  const memoizedGraphData = useMemo(() => {
    if (!permissionDetails || permissionDetails.length === 0) {
      return null;
    }

    const uniqueAddresses = new Set<string>();
    permissionDetails.forEach((permission) => {
      uniqueAddresses.add(permission.grantor_key);
      uniqueAddresses.add(permission.grantee_key);
    });

    // Create nodes
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
          color = "#ff6b6b"; // red for grantors
        } else if (isGrantee) {
          color = "#1dd1a1"; // green for grantees
        }

        return {
          id: address,
          name: `${address.substring(0, 6)}...${address.substring(address.length - 4)}`,
          color,
          val: 10,
          fullAddress: address,
          role:
            isGrantor && isGrantee ? "Both" : isGrantor ? "Grantor" : "Grantee",
        };
      },
    );

    const links = permissionDetails.map((permission) => ({
      source: permission.grantor_key,
      target: permission.grantee_key,
      id: permission.permission_id,
      scope: permission.scope,
      duration: permission.duration,
      enforcement: permission.enforcement,
    }));

    return { nodes, links };
  }, [permissionDetails]);

  useEffect(() => {
    setGraphData(memoizedGraphData);
  }, [memoizedGraphData]);

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
      <div className="absolute top-[3.9rem] left-2 right-96 z-10">
        <div className="flex items-center gap-4 w-full max-w-4xl flex-wrap">
          <PortalNavigationTabs />
          <div className="flex-1 min-w-0">
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
