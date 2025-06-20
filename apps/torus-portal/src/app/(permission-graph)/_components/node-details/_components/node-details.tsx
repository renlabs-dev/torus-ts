"use client";

import type {
  CustomGraphData,
  CustomGraphNode,
  PermissionDetails,
  CachedAgentData,
} from "../../permission-graph-types";
import { getNodePermissions } from "../../permission-graph-utils";
import { useMemo, memo } from "react";
import { NodeDetailsCard } from "./node-details-card";

interface PermissionNodeDetailsProps {
  selectedNode: CustomGraphNode;
  graphData: CustomGraphData | null;
  permissionDetails?: PermissionDetails;
  getCachedAgentData?: (nodeId: string) => CachedAgentData | null;
  setCachedAgentData?: (nodeId: string, data: CachedAgentData) => void;
}

export const NodeDetails = memo(function NodeDetails({
  selectedNode,
  graphData,
  permissionDetails,
}: PermissionNodeDetailsProps) {
  const nodePermissions = useMemo(
    () => (graphData ? getNodePermissions(selectedNode, graphData) : []),
    [selectedNode, graphData],
  );

  if (!graphData) return null;

  return (
    <NodeDetailsCard
      graphData={graphData}
      nodePermissions={nodePermissions}
      permissionDetails={permissionDetails}
      selectedNode={selectedNode}
    />
  );
});
