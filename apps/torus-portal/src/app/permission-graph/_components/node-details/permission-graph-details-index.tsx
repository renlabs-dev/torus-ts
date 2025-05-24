import { PermissionGraphOverview } from "../permission-graph-overview";
import { PermissionNodeDetails } from "./permission-graph-node-details";
import type { CustomGraphData, CustomGraphNode } from "../permission-graph-utils";

interface PermissionGraphDetailsProps {
  selectedNode: CustomGraphNode | null;
  graphData: CustomGraphData | null;
  onBackgroundClick?: () => void;
}

export function PermissionGraphDetails({ 
  selectedNode, 
  graphData, 
  onBackgroundClick 
}: PermissionGraphDetailsProps) {
  if (!selectedNode) {
    return <PermissionGraphOverview graphData={graphData} />;
  }
  
  return (
    <PermissionNodeDetails 
      selectedNode={selectedNode} 
      graphData={graphData}
      onBackgroundClick={onBackgroundClick}
    />
  );
}