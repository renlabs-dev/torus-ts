"use client";

import { useState, useEffect } from "react";
import PermissionGraph from "./permission-graph";
import PermissionGraphControls from "./permission-graph-controls";
import type {
  CustomGraphData,
  CustomGraphNode,
} from "./permission-graph-utils";
import { samplePermissionGraph } from "./permission-graph-utils";
import { PermissionGraphDetails } from "./permission-graph-details";
import { api } from "~/trpc/react";

export default function PermissionGraphContainer() {
  const [graphData, setGraphData] = useState<CustomGraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<CustomGraphNode | null>(
    null,
  );

  // Fetch permission details from the API
  const { data: permissionDetails, isLoading } = api.permission.details.all.useQuery();

  console.log("permissionDetails: ", permissionDetails);

  useEffect(() => {
    if (permissionDetails && permissionDetails.length > 0) {
      // Create nodes for unique grantor and grantee addresses
      const uniqueAddresses = new Set<string>();
      permissionDetails.forEach((permission) => {
        uniqueAddresses.add(permission.grantor_key);
        uniqueAddresses.add(permission.grantee_key);
      });

      // Create nodes
      const nodes: CustomGraphNode[] = Array.from(uniqueAddresses).map((address) => {
        // Determine if it's a grantor, grantee, or both
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

      // Create links based on permissions
      const links = permissionDetails.map((permission) => ({
        source: permission.grantor_key,
        target: permission.grantee_key,
        id: permission.permission_id.toString(),
        scope: permission.scope,
        duration: permission.duration,
        enforcement: permission.enforcement,
      }));

      setGraphData({ nodes, links });
    } else if (!isLoading) {
      // If no data is available, use the sample graph data
      console.log("No permission data found, using sample data");
      setGraphData(samplePermissionGraph);
    }
  }, [permissionDetails, isLoading]);

  const handleNodeSelect = (node: CustomGraphNode) => {
    setSelectedNode(node);
  };

  return (
    <div className="fixed inset-0 w-screen h-screen">
      <div className="absolute top-[3.9rem] left-2 right-96 z-10">
        <PermissionGraphControls />
      </div>

      <div className="absolute right-4 mt-[calc(4rem)]">
        <PermissionGraphDetails
          selectedNode={selectedNode}
          graphData={graphData}
        />
      </div>

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
