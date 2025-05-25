import { PermissionGraphOverview } from "../permission-graph-overview";
import { NodeDetailsCard } from "./_components/node-details-card";
import type { CustomGraphData, CustomGraphNode } from "../permission-graph-utils";

interface PermissionGraphDetailsProps {
  selectedNode: CustomGraphNode | null;
  graphData: CustomGraphData | null;
  onBackgroundClick?: () => void;
}

export function PermissionGraphNodeDetails({ 
  selectedNode, 
  graphData, 
  onBackgroundClick 
}: PermissionGraphDetailsProps) {
  if (!selectedNode) {
    return <PermissionGraphOverview graphData={graphData} />;
  }
  
  return (
    <NodeDetailsCard
      selectedNode={selectedNode} 
      graphData={graphData}
      onBackgroundClick={onBackgroundClick}
    />
  );
}