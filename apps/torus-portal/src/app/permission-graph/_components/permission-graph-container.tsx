"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import PermissionGraph from "./permission-graph";
import PermissionGraphControls from "./permission-graph-controls";
import type {
  CustomGraphData,
  CustomGraphNode,
} from "./permission-graph-utils";
import { PermissionGraphNodeDetails } from "./node-details";
import { api } from "~/trpc/react";

export default function PermissionGraphContainer() {
  const [graphData, setGraphData] = useState<CustomGraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<CustomGraphNode | null>(null);
  
  const { data: permissionDetails, isLoading } = api.permissionDetails.all.useQuery();

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
    const nodes: CustomGraphNode[] = Array.from(uniqueAddresses).map((address) => {
      const isGrantor = permissionDetails.some(p => p.grantor_key === address);
      const isGrantee = permissionDetails.some(p => p.grantee_key === address);

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
        role: isGrantor && isGrantee ? "Both" : isGrantor ? "Grantor" : "Grantee"
      };
    });

    const links = permissionDetails.map((permission) => ({
      source: permission.grantor_key,
      target: permission.grantee_key,
      id: permission.permission_id.toString(),
      scope: permission.scope,
      duration: permission.duration,
      enforcement: permission.enforcement,
    }));

    return { nodes, links };
  }, [permissionDetails]);

  useEffect(() => {
    setGraphData(memoizedGraphData);
  }, [memoizedGraphData]);

  const handleNodeSelect = useCallback((node: CustomGraphNode) => {
    setSelectedNode(node);
    // Update URL with the agent key
    window.history.pushState({}, '', `/permission-graph/agent/${node.id}`);
  }, []);

  return (
    <div className="fixed inset-0 w-screen h-screen">
      <div className="absolute top-[3.9rem] left-2 right-96 z-10">
        <PermissionGraphControls nodeIds={graphData?.nodes.map(node => node.id) ?? []} />
      </div>

      <div className="z-50 absolute right-4 mt-[calc(4rem)]">
        <PermissionGraphNodeDetails
          selectedNode={selectedNode}
          graphData={graphData}
          permissionDetails={permissionDetails}
        />
      </div>

      <div className="w-full h-full">
        {isLoading ? (
          <div className="flex items-center justify-center w-full h-full">
            <div className="text-xl">Loading permission graph...</div>
          </div>
        ) : (
          <PermissionGraph 
            data={graphData} 
            onNodeClick={handleNodeSelect} 
          />
        )}
      </div>
    </div>
  );
}