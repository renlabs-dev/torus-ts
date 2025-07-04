"use client";

import { useMemo } from "react";

import type {
  allPermissions,
  CachedAgentData,
  CustomGraphData,
  CustomGraphNode,
} from "../../permission-graph-types";
import { getNodePermissions } from "../../permission-graph-utils";
import { NodeDetailsCard } from "./graph-sheet-details-card";

interface GraphSheetDetailsProps {
  selectedNode: CustomGraphNode;
  graphData: CustomGraphData | null;
  allPermissions?: allPermissions;
  getCachedAgentData?: (nodeId: string) => CachedAgentData | null;
  setCachedAgentData?: (nodeId: string, data: CachedAgentData) => void;
}

export function GraphSheetDetails({
  selectedNode,
  graphData,
  allPermissions,
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
      allPermissions={allPermissions}
      selectedNode={selectedNode}
    />
  );
}
