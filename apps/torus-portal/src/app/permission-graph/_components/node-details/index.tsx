import { PermissionGraphOverview } from "../permission-graph-overview";
import { NodeDetailsCard } from "./_components/node-details-card";
import type { CustomGraphData, CustomGraphNode, PermissionDetail } from "../permission-graph-utils";
import { memo } from "react";

interface PermissionGraphDetailsProps {
  selectedNode: CustomGraphNode | null;
  graphData: CustomGraphData | null;
  permissionDetails?: PermissionDetail[];
  onBackgroundClick?: () => void;
}

export const PermissionGraphNodeDetails = memo(function PermissionGraphNodeDetails({ 
  selectedNode, 
  graphData, 
  permissionDetails,
  onBackgroundClick 
}: PermissionGraphDetailsProps) {
  if (!selectedNode) {
    return <PermissionGraphOverview graphData={graphData} />;
  }
  
  return (
    <NodeDetailsCard
      selectedNode={selectedNode} 
      graphData={graphData}
      permissionDetails={permissionDetails}
      onBackgroundClick={onBackgroundClick}
    />
  );
});