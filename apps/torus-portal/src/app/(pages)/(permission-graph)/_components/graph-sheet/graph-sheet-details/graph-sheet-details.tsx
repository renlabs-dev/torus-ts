"use client";

import type {
  CustomGraphData,
  CustomGraphNode,
  PermissionDetails,
  CachedAgentData,
} from "../../permission-graph-types";
import { getNodePermissions } from "../../permission-graph-utils";
import { useMemo } from "react";
import { NodeDetailsCard } from "./graph-sheet-details-card";

interface GraphSheetDetailsProps {
  selectedNode: CustomGraphNode;
  graphData: CustomGraphData | null;
  permissionDetails?: PermissionDetails;
  getCachedAgentData?: (nodeId: string) => CachedAgentData | null;
  setCachedAgentData?: (nodeId: string, data: CachedAgentData) => void;
}

export function GraphSheetDetails({
  selectedNode,
  graphData,
  permissionDetails,
}: GraphSheetDetailsProps) {
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
}
