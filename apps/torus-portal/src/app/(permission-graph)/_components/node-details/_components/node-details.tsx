"use client";

import type {
  CustomGraphData,
  CustomGraphNode,
  PermissionDetail,
  CachedAgentData,
} from "../../permission-graph-utils";
import {
  getNodePermissions,
  sortPermissions,
} from "../../permission-graph-utils";
import { useMemo, memo } from "react";
import { NodeDetailsCard } from "./node-details-card";

interface PermissionNodeDetailsProps {
  selectedNode: CustomGraphNode;
  graphData: CustomGraphData | null;
  permissionDetails?: PermissionDetail[];
  getCachedAgentData?: (nodeId: string) => CachedAgentData | null;
  setCachedAgentData?: (nodeId: string, data: CachedAgentData) => void;
  onBackgroundClick?: () => void;
}

export const NodeDetails = memo(function NodeDetails({
  selectedNode,
  graphData,
  permissionDetails,
  // TODO : When click on the background, it should close the details
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onBackgroundClick,
}: PermissionNodeDetailsProps) {
  const nodePermissions = useMemo(
    () => (graphData ? getNodePermissions(selectedNode, graphData) : []),
    [selectedNode, graphData],
  );

  const sortedPermissions = useMemo(() => {
    const original = sortPermissions(nodePermissions, permissionDetails ?? []);
    return [...original, ...original, ...original, ...original, ...original];
  }, [nodePermissions, permissionDetails]);

  if (!graphData) return null;

  return (
    <NodeDetailsCard
      sortedPermissions={sortedPermissions}
      nodePermissions={nodePermissions}
      graphData={graphData}
      permissionDetails={permissionDetails}
    />
  );
});
