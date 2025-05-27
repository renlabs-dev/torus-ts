"use client";

import type { CustomGraphData, CustomGraphNode, PermissionDetail, CachedAgentData } from "../../permission-graph-utils";
import { 
  getNodePermissions,
  sortPermissions,
 } from "../../permission-graph-utils";
import { useMemo, memo } from "react";
import { NodeDetailsSkeleton } from "./node-details-skeleton";

interface PermissionNodeDetailsProps {
  selectedNode: CustomGraphNode;
  graphData: CustomGraphData | null;
  permissionDetails?: PermissionDetail[];
  getCachedAgentData?: (nodeId: string) => CachedAgentData | null;
  setCachedAgentData?: (nodeId: string, data: CachedAgentData) => void;
  onBackgroundClick?: () => void;
}

export const NodeDetailsCard = memo(function NodeDetailsCard({ 
  selectedNode, 
  graphData,
  permissionDetails,
  // TODO : When click on the background, it should close the details
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onBackgroundClick 
}: PermissionNodeDetailsProps) {

  const nodePermissions = useMemo(() => 
    graphData ? getNodePermissions(selectedNode, graphData) : [], 
    [selectedNode, graphData]
  );
  
  const sortedPermissions = useMemo(() => 
    sortPermissions(nodePermissions, permissionDetails ?? []), 
    [nodePermissions, permissionDetails]
  );

  if (!graphData) return null;

  return (
    <NodeDetailsSkeleton
      sortedPermissions={sortedPermissions}
      nodePermissions={nodePermissions}
      graphData={graphData}
      permissionDetails={permissionDetails}
    />
  );
});